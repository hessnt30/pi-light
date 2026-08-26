"use client";

import { useEffect } from "react";
import type { CalendarView } from "@/lib/calendar/types";

type Handlers = {
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
  onViewChange: (view: CalendarView) => void;
};

export function useKeyboardShortcuts(handlers: Handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "t":
          e.preventDefault();
          handlers.onToday();
          break;
        case "f":
          e.preventDefault();
          handlers.onFullscreen();
          break;
        case "arrowleft":
          e.preventDefault();
          handlers.onPrev();
          break;
        case "arrowright":
          e.preventDefault();
          handlers.onNext();
          break;
        case "w":
          e.preventDefault();
          handlers.onViewChange("week");
          break;
        case "m":
          e.preventDefault();
          handlers.onViewChange("month");
          break;
        case "d":
          e.preventDefault();
          handlers.onViewChange("day");
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers, enabled]);
}
