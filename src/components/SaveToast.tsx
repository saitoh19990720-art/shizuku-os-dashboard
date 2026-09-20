import { useEffect, useState } from "react";
import { useLastSavedAt } from "../hooks/useLocalStorage";

// 自動保存の成功感：一瞬のトースト＋最終保存時刻。
function formatTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function SaveToast() {
  const lastSavedAt = useLastSavedAt();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (lastSavedAt === null) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1600);
    return () => window.clearTimeout(t);
  }, [lastSavedAt]);

  if (lastSavedAt === null) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2"
    >
      <div
        className={`rounded-full border border-main-200 bg-white/95 px-4 py-2 text-xs shadow-soft backdrop-blur-sm transition-opacity ${
          flash ? "opacity-100" : "opacity-80"
        }`}
      >
        {flash ? (
          <span className="font-medium text-accent-600">保存しました</span>
        ) : (
          <span className="text-neutral2-500">
            最終保存 <span className="font-medium text-ink">{formatTime(lastSavedAt)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
