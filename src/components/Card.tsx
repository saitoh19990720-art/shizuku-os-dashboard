import type { ReactNode } from "react";

// 全カード共通の見た目（角丸・薄い影・透明感のある白面）。
// eyebrow＝小さな英字ラベル、title＝明朝の見出し。
interface CardProps {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}

export default function Card({ eyebrow, title, children }: CardProps) {
  return (
    <section className="rounded-card border border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur-sm">
      <header className="mb-4">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-400">
            {eyebrow}
          </p>
        )}
        <h2 className="font-mincho text-lg font-semibold text-ink">{title}</h2>
      </header>
      {children}
    </section>
  );
}
