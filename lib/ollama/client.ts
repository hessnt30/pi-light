export type OllamaConfig = {
  host: string;
  model: string;
};

export class OllamaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

export function getOllamaConfig(): OllamaConfig {
  return {
    host: (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(
      /\/$/,
      "",
    ),
    model: process.env.OLLAMA_MODEL ?? "llama3.2",
  };
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  model: string;
  message?: { content?: string };
  error?: string;
};

export async function ollamaChat({
  messages,
  model,
  temperature = 0.4,
  timeoutMs = 300_000,
}: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<{ model: string; content: string }> {
  const config = getOllamaConfig();
  const usedModel = model ?? config.model;

  let res: Response;
  try {
    res = await fetch(`${config.host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: usedModel,
        messages,
        stream: false,
        options: {
          temperature,
          num_predict: 400,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "TimeoutError"
        ? `Ollama timed out after ${Math.round(timeoutMs / 1000)}s`
        : `Ollama is not reachable at ${config.host}`;
    throw new OllamaError(reason, 503);
  }

  const data = (await res.json().catch(() => ({}))) as OllamaChatResponse;

  if (!res.ok) {
    throw new OllamaError(
      data.error ?? `Ollama returned ${res.status}`,
      res.status >= 400 && res.status < 600 ? res.status : 502,
    );
  }

  const content = data.message?.content?.trim();
  if (!content) {
    throw new OllamaError("Ollama returned an empty response", 502);
  }

  return { model: data.model || usedModel, content };
}
