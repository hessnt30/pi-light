"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  THEME_GROUPS,
  themesInCategory,
  type ThemeDefinition,
  type ThemeMode,
} from "@/lib/themes";

export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}) {
  return (
    <div className="space-y-5">
      <span className="text-sm text-muted">Theme</span>
      {THEME_GROUPS.map((group) => (
        <div key={group.id}>
          <h3 className="mb-2 text-sm font-medium text-muted">{group.label}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {themesInCategory(group.id).map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={value === theme.id}
                onSelect={onChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: ThemeDefinition;
  selected: boolean;
  onSelect: (theme: ThemeMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      aria-pressed={selected}
      className={cn(
        "overflow-hidden rounded-xl border-2 text-left transition-colors",
        selected
          ? "border-accent ring-2 ring-accent/30"
          : "border-border hover:border-foreground/30",
      )}
    >
      <div className="relative h-16 overflow-hidden">
        {theme.image ? (
          <Image
            src={theme.image}
            alt=""
            fill
            sizes="200px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full">
            {theme.swatches.map((color) => (
              <div
                key={color}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-sm font-medium">{theme.label}</span>
        <span className="flex gap-1" aria-hidden>
          {theme.swatches.map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-full border border-border"
              style={{ backgroundColor: color }}
            />
          ))}
        </span>
      </div>
    </button>
  );
}
