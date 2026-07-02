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
  const [open, setOpen] = useLocalStorage<boolean>(`shizuku.cardOpen.${title}`, defaultOpen);
  return (
    <section className="rounded-card border border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <span>
          {eyebrow && (
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-accent-400">
              {eyebrow}
            </span>
          )}
          <span className="block font-mincho text-lg font-semibold text-ink">{title}</span>
        </span>
        <span
          aria-hidden
          className={`mt-1 shrink-0 text-accent-400 transition-transform ${open ? "" : "-rotate-90"}`}
        >
          ▾
        </span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
