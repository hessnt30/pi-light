"use client";

export function OfflineIndicator({
  isOffline,
  fetchedAt,
}: {
  isOffline: boolean;
  fetchedAt: number | null;
}) {
  if (!isOffline && !fetchedAt) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isOffline && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          Offline
        </span>
      )}
      {fetchedAt && (
        <span className="text-muted">
          Updated {formatRelative(fetchedAt)}
        </span>
      )}
    </div>
  );
}

function formatRelative(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}
