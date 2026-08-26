import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptToken, encryptToken } from "@/lib/google/token-store";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(state: string) {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: SCOPES,
    state,
  });
}

export async function exchangeCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  return {
    tokens,
    email: userInfo.email!,
    sub: userInfo.id!,
  };
}

export async function getAuthenticatedClient(
  supabase: SupabaseClient,
  accountId: string,
) {
  const { data: account, error } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error || !account) {
    throw new Error("Google account not found");
  }

  const client = getOAuth2Client();
  const refreshToken = decryptToken(account.encrypted_refresh_token);

  client.setCredentials({
    refresh_token: refreshToken,
    access_token: account.access_token ?? undefined,
    expiry_date: account.token_expires_at
      ? new Date(account.token_expires_at).getTime()
      : undefined,
  });

  client.on("tokens", async (tokens) => {
    const updates: Record<string, string> = {};
    if (tokens.access_token) updates.access_token = tokens.access_token;
    if (tokens.expiry_date) {
      updates.token_expires_at = new Date(tokens.expiry_date).toISOString();
    }
    if (Object.keys(updates).length > 0) {
      await supabase
        .from("google_accounts")
        .update(updates)
        .eq("id", accountId);
    }
  });

  return client;
}

export async function storeGoogleAccount(
  supabase: SupabaseClient,
  {
    householdId,
    userId,
    email,
    sub,
    refreshToken,
    accessToken,
    expiresAt,
  }: {
    householdId: string;
    userId: string;
    email: string;
    sub: string;
    refreshToken: string;
    accessToken?: string | null;
    expiresAt?: Date | null;
  },
) {
  const encrypted = encryptToken(refreshToken);

  const { data, error } = await supabase
    .from("google_accounts")
    .upsert(
      {
        household_id: householdId,
        connected_by_user_id: userId,
        google_email: email,
        google_sub: sub,
        encrypted_refresh_token: encrypted,
        access_token: accessToken ?? null,
        token_expires_at: expiresAt?.toISOString() ?? null,
      },
      { onConflict: "household_id,google_sub" },
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function revokeAndDeleteAccount(
  supabase: SupabaseClient,
  accountId: string,
) {
  try {
    const client = await getAuthenticatedClient(supabase, accountId);
    await client.revokeCredentials();
  } catch {
    // token may already be invalid
  }

  await supabase.from("google_accounts").delete().eq("id", accountId);
}
