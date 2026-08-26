export const THEME_MODES = [
  "system",
  "light",
  "dark",
  "pastel-blush",
  "pastel-mint",
  "pastel-lavender",
  "pastel-peach",
  "pastel-sky",
  "halloween",
  "thanksgiving",
  "christmas",
  "new-year",
  "valentines",
  "easter",
] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ThemeAppearance = "light" | "dark";
export type ThemeCategory = "core" | "pastel" | "holiday";

export type ThemeDecoration = {
  src: string;
  className: string;
  blend: "screen" | "multiply";
};

export type ThemeDefinition = {
  id: ThemeMode;
  label: string;
  category: ThemeCategory;
  appearance: ThemeAppearance;
  swatches: [string, string, string];
  image?: string;
  decorations?: ThemeDecoration[];
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "system",
    label: "System",
    category: "core",
    appearance: "light",
    swatches: ["#faf8f5", "#1c1917", "#6366f1"],
  },
  {
    id: "light",
    label: "Light",
    category: "core",
    appearance: "light",
    swatches: ["#faf8f5", "#ffffff", "#6366f1"],
  },
  {
    id: "dark",
    label: "Dark",
    category: "core",
    appearance: "dark",
    swatches: ["#141210", "#1c1917", "#818cf8"],
  },
  {
    id: "pastel-blush",
    label: "Blush",
    category: "pastel",
    appearance: "light",
    swatches: ["#fdf2f4", "#fff7f8", "#e8a0b0"],
  },
  {
    id: "pastel-mint",
    label: "Mint",
    category: "pastel",
    appearance: "light",
    swatches: ["#f0faf6", "#f7fdfb", "#7ec9a8"],
  },
  {
    id: "pastel-lavender",
    label: "Lavender",
    category: "pastel",
    appearance: "light",
    swatches: ["#f5f2fb", "#fbf9fe", "#a78bda"],
  },
  {
    id: "pastel-peach",
    label: "Peach",
    category: "pastel",
    appearance: "light",
    swatches: ["#fff4ec", "#fffaf6", "#f0a07a"],
  },
  {
    id: "pastel-sky",
    label: "Sky",
    category: "pastel",
    appearance: "light",
    swatches: ["#eef6fc", "#f7fbfe", "#7eb8d8"],
  },
  {
    id: "halloween",
    label: "Halloween",
    category: "holiday",
    appearance: "dark",
    swatches: ["#1a0e08", "#2a1810", "#f97316"],
    image: "/themes/halloween-bg.jpg",
    decorations: [
      {
        src: "/themes/halloween-lantern.png",
        className: "bottom-0 left-0 h-36 w-36 sm:h-48 sm:w-48",
        blend: "screen",
      },
      {
        src: "/themes/halloween-lantern-2.png",
        className: "bottom-0 right-0 h-32 w-32 sm:h-44 sm:w-44",
        blend: "screen",
      },
    ],
  },
  {
    id: "thanksgiving",
    label: "Thanksgiving",
    category: "holiday",
    appearance: "light",
    swatches: ["#faf3e8", "#fffaf2", "#c45c26"],
    image: "/themes/thanksgiving-bg.jpg",
    decorations: [
      {
        src: "/themes/thanksgiving-harvest.png",
        className: "bottom-0 left-0 h-36 w-36 sm:h-48 sm:w-48",
        blend: "multiply",
      },
      {
        src: "/themes/thanksgiving-harvest.png",
        className: "bottom-0 right-0 h-32 w-32 scale-x-[-1] sm:h-44 sm:w-44",
        blend: "multiply",
      },
    ],
  },
  {
    id: "christmas",
    label: "Christmas",
    category: "holiday",
    appearance: "dark",
    swatches: ["#0c1f18", "#163328", "#e4453a"],
    image: "/themes/christmas-bg.jpg",
    decorations: [
      {
        src: "/themes/christmas-wreath.png",
        className: "bottom-0 left-0 h-32 w-32 sm:h-44 sm:w-44",
        blend: "screen",
      },
      {
        src: "/themes/christmas-tree.png",
        className: "bottom-0 right-0 h-40 w-40 sm:h-52 sm:w-52",
        blend: "screen",
      },
    ],
  },
  {
    id: "new-year",
    label: "New Year",
    category: "holiday",
    appearance: "dark",
    swatches: ["#0b1220", "#151d32", "#d4af37"],
    image: "/themes/new-year-bg.jpg",
    decorations: [
      {
        src: "/themes/new-year-sparkle.png",
        className: "bottom-0 left-0 h-36 w-36 sm:h-48 sm:w-48",
        blend: "screen",
      },
      {
        src: "/themes/new-year-sparkle.png",
        className: "right-0 bottom-0 h-28 w-28 sm:h-40 sm:w-40",
        blend: "screen",
      },
    ],
  },
  {
    id: "valentines",
    label: "Valentine's",
    category: "holiday",
    appearance: "light",
    swatches: ["#fde8ee", "#fff6f8", "#e11d48"],
    image: "/themes/valentines-bg.jpg",
    decorations: [
      {
        src: "/themes/valentines-hearts.png",
        className: "bottom-0 left-0 h-32 w-32 sm:h-44 sm:w-44",
        blend: "multiply",
      },
      {
        src: "/themes/valentines-hearts.png",
        className: "bottom-0 right-0 h-28 w-28 scale-x-[-1] sm:h-40 sm:w-40",
        blend: "multiply",
      },
    ],
  },
  {
    id: "easter",
    label: "Easter",
    category: "holiday",
    appearance: "light",
    swatches: ["#f7f4ee", "#fffcf7", "#b48fd4"],
    image: "/themes/easter-bg.jpg",
    decorations: [
      {
        src: "/themes/easter-eggs.png",
        className: "bottom-0 left-0 h-32 w-32 sm:h-44 sm:w-44",
        blend: "multiply",
      },
      {
        src: "/themes/easter-eggs.png",
        className: "bottom-0 right-0 h-28 w-28 scale-x-[-1] sm:h-40 sm:w-40",
        blend: "multiply",
      },
    ],
  },
];

export const THEME_GROUPS: { id: ThemeCategory; label: string }[] = [
  { id: "core", label: "Core" },
  { id: "pastel", label: "Pastel" },
  { id: "holiday", label: "Holidays" },
];

const THEME_BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]));

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

export function coerceTheme(value: string | null | undefined): ThemeMode {
  return isThemeMode(value) ? value : "system";
}

export function getTheme(id: ThemeMode): ThemeDefinition {
  return THEME_BY_ID.get(id) ?? THEME_BY_ID.get("system")!;
}

export function themesInCategory(category: ThemeCategory): ThemeDefinition[] {
  return THEMES.filter((theme) => theme.category === category);
}
