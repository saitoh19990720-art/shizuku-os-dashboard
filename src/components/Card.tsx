import { type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// 全カード共通の見た目（角丸・薄い影・透明感のある白面）。
// 見出しをタップで開閉でき、開閉状態は localStorage に保存（次回も同じ状態で戻れる）。
interface CardProps {
  eyebrow?: string;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function Card({ eyebrow, title, defaultOpen = true, children }: CardProps) {
  // v2: 主カード／二次カードの既定開閉をリセット（must-fix 2）
  const [open, setOpen] = useLocalStorage<boolean>(`shizuku.cardOpen.v2.${title}`, defaultOpen);
  return (
    <section className="rounded-card border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
      <h2>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <span>
            {eyebrow && (
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-accent-500">
                {eyebrow}
              </span>
            )}
            <span className="block font-mincho text-lg font-semibold text-ink">{title}</span>
          </span>
          <span
            aria-hidden
            className={`mt-1 shrink-0 text-accent-500 transition-transform ${open ? "" : "-rotate-90"}`}
          >
            ▾
          </span>
        </button>
      </h2>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
