import TaskCard from "./components/TaskCard";
import NightLogCard from "./components/NightLogCard";
import LinksCard from "./components/LinksCard";
import QualityGateCard from "./components/QualityGateCard";

// スマホ幅（360px前後）の1画面ダッシュボード。
// 3カードを縦に並べ、広い画面では中央寄せで読みやすく。
export default function App() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col gap-4 px-4 py-8">
      <header className="mb-2 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent-400">
          Shizuku OS
        </p>
        <h1 className="font-mincho text-2xl font-semibold text-ink">
          しずくの仕事机
        </h1>
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
