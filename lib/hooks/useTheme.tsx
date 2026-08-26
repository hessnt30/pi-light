"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  coerceTheme,
  getTheme,
  type ThemeAppearance,
  type ThemeMode,
} from "@/lib/themes";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolved: ThemeAppearance;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function computeAppearance(
  theme: ThemeMode,
  systemDark: boolean,
): ThemeAppearance {
  if (theme === "system") return systemDark ? "dark" : "light";
  if (theme === "light" || theme === "dark") return theme;
  return getTheme(theme).appearance;
}

function applyDomTheme(theme: ThemeMode, appearance: ThemeAppearance) {
  const root = document.documentElement;
  root.classList.toggle("dark", appearance === "dark");

  if (theme === "system" || theme === "light" || theme === "dark") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function ThemeProvider({
  initialTheme = "system",
  children,
}: {
  initialTheme?: ThemeMode;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    coerceTheme(initialTheme),
  );
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  const resolved = useMemo(
    () => computeAppearance(theme, systemDark),
    [theme, systemDark],
  );

  useEffect(() => {
    applyDomTheme(theme, resolved);
  }, [theme, resolved]);

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      setSystemDark(mq.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(coerceTheme(next));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolved }),
    [theme, setTheme, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeChrome />
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeChrome() {
  const { theme } = useTheme();
  const decorations = getTheme(theme).decorations;
  if (!decorations?.length) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
    >
      {decorations.map((decoration, index) => (
        <Image
          key={`${decoration.src}-${index}`}
          src={decoration.src}
          alt=""
          width={192}
          height={192}
          unoptimized
          className={cn(
            "absolute object-contain select-none",
            decoration.className,
          )}
          style={{
            mixBlendMode: decoration.blend,
            maskImage: "radial-gradient(circle, black 46%, transparent 74%)",
            WebkitMaskImage:
              "radial-gradient(circle, black 46%, transparent 74%)",
          }}
        />
      ))}
    </div>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
