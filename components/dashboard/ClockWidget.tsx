"use client";

import { useEffect, useState } from "react";
import { formatClock, formatClockDate } from "@/lib/utils/format";

export function ClockWidget({
  timezone,
  displayMode = false,
}: {
  timezone: string;
  displayMode?: boolean;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div
        className={
          displayMode ? "text-5xl font-light tabular-nums" : "text-3xl font-light tabular-nums"
        }
      >
        {formatClock(now, timezone)}
      </div>
      <div className={displayMode ? "text-xl text-muted" : "text-base text-muted"}>
        {formatClockDate(now, timezone)}
      </div>
    </div>
  );
}
