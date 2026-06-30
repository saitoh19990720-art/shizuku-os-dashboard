import { useEffect, useState } from "react";
import Landing from "./components/Landing";
import TaskCard from "./components/TaskCard";
import NightLogCard from "./components/NightLogCard";
import LinksCard from "./components/LinksCard";
import QualityGateCard from "./components/QualityGateCard";

// 依存を増やさない軽量ハッシュルーティング。
// `#/dashboard` のとき Dashboard、それ以外は Landing を表示する。
function useHashRoute() {
  const [hash, setHash] = useState(
    () => (typeof window !== "undefined" ? window.location.hash : ""),
  );
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0); // ページ切替時は先頭へ
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

// Shizuku OS Dashboard 本体（4カードの1画面）。
function Dashboard() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col gap-4 px-4 py-8">
      <header className="mb-2 px-1">
        <a
          href="#/"
          className="mb-3 inline-flex min-h-[36px] items-center text-xs text-accent-500 transition-colors hover:text-accent-600"
        >
          ← Shizuku OS について（Aboutに戻る）
        </a>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent-400">
          Shizuku OS
        </p>
        <h1 className="font-mincho text-2xl font-semibold text-ink">しずくの仕事机</h1>
        <p className="mt-1 text-xs text-neutral2-300">
          制作・夜ログ・リンク・採用判定を、静かに一画面で。
        </p>
      </header>

      <TaskCard />
      <NightLogCard />
      <LinksCard />
      <QualityGateCard />

      <footer className="mt-2 px-1 text-center text-[11px] text-neutral2-300">
        入力はこの端末に自動保存されます（localStorage）。
      </footer>
    </main>
  );
}

export default function App() {
  const hash = useHashRoute();
  const isDashboard = hash === "#/dashboard" || hash === "#dashboard";
  return isDashboard ? <Dashboard /> : <Landing />;
}
