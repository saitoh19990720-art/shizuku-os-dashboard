import { type ReactNode, useId } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { cardOpenKey } from "../lib/cardOpenKey";

// 全カード共通の見た目（角丸・薄い影・透明感のある白面）。
// 見出しをタップで開閉でき、開閉状態は localStorage に保存（次回も同じ状態で戻れる）。
interface CardProps {
  eyebrow?: string;
  title: string;
  /**
   * 開閉状態の保存に使う名前。表示タイトルを変えたカードは旧タイトルを渡し、
   * 保存済みの開閉状態を引き継ぐ。未指定なら title を使う（従来どおり）。
   */
  storageTitle?: string;
  /** 保存済みの開閉状態が無いときだけ使う初期値。 */
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function Card({
  eyebrow,
  title,
  storageTitle,
  defaultOpen = true,
  children,
}: CardProps) {
  // v2: 主カード／二次カードの既定開閉をリセット（must-fix 2）
  const [open, setOpen] = useLocalStorage<boolean>(
    cardOpenKey(storageTitle ?? title),
    defaultOpen,
  );
  const panelId = useId();
  return (
    <section className="rounded-card border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-[44px] w-full items-start justify-between gap-3 text-left"
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
      <div id={panelId} hidden={!open} className="mt-4">
        {open && children}
      </div>
    </section>
  );
}
