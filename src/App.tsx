import { useEffect, useState } from "react";
import Landing from "./components/Landing";
import CaseStudy from "./components/CaseStudy";
import StartHereBanner from "./components/StartHereBanner";
import SaveToast from "./components/SaveToast";
import ConditionCard from "./components/ConditionCard";
import NextActionCard from "./components/NextActionCard";
import TaskCard from "./components/TaskCard";
import RoleRouterCard from "./components/RoleRouterCard";
import PromptBuilderCard from "./components/PromptBuilderCard";
import NightLogCard from "./components/NightLogCard";
import LinksCard from "./components/LinksCard";
import QualityGateCard from "./components/QualityGateCard";
import WeeklyReviewCard from "./components/WeeklyReviewCard";
import BrandPanelCard from "./components/BrandPanelCard";
import DataBridgeCard from "./components/DataBridgeCard";
import RetireCard from "./components/RetireCard";
import StorageAlert from "./components/StorageAlert";

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

const NAV = [
  { id: "today", label: "Today", accessibleLabel: "Today：今日の制作候補へ移動" },
  { id: "log", label: "Log", accessibleLabel: "Log：夜タスク3行ログへ移動" },
  { id: "gate", label: "Gate", accessibleLabel: "Gate：Quality Gateへ移動" },
  { id: "more", label: "More", accessibleLabel: "More：その他のカードへ移動" },
] as const;

// ハッシュルーティング（#/dashboard）を壊さないよう、location.hash は変えずにスクロールする。
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Shizuku OS Dashboard 本体。
// 主カード（Today／制作候補／Night log／Quality Gate）は開、二次は畳み。
// 上部に Start here ＋ sticky ナビ。
function Dashboard() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col gap-4 px-4 pb-16 pt-8">
      <header className="mb-1 px-1">
        <a
          href="#/"
          className="mb-3 inline-flex min-h-[36px] items-center text-xs text-accent-600 transition-colors hover:text-accent-500"
        >
          ← Shizuku OS について（Aboutに戻る）
        </a>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent-500">
          Shizuku OS
        </p>
        <h1 className="font-mincho text-2xl font-semibold text-ink">しずくの仕事机</h1>
        <p className="mt-1 text-xs text-neutral2-500">
          制作・夜ログ・リンク・採用判定を、静かに一画面で。
        </p>
      </header>

      {/* sticky ミニナビ（モバイルで主WFへすぐ戻る） */}
      <nav
        aria-label="セクション"
        className="sticky top-0 z-20 -mx-4 border-b border-main-200/90 bg-[#f7f8fc]/92 px-4 py-2 backdrop-blur-md"
      >
        <ul className="flex items-center gap-1">
          {NAV.map((item) => (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => scrollToSection(item.id)}
                aria-label={item.accessibleLabel}
                className="flex min-h-[40px] w-full items-center justify-center rounded-xl text-xs font-semibold text-accent-600 transition-colors hover:bg-main-100"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <StorageAlert />
      <StartHereBanner />

      {/* 二次：コンディション等は畳み */}
      <ConditionCard />
      <NextActionCard />

      <div id="today" className="scroll-mt-14">
        <TaskCard />
      </div>

      <RoleRouterCard />
      <PromptBuilderCard />

      <div id="log" className="scroll-mt-14">
        <NightLogCard />
      </div>

      <LinksCard />

      <div id="gate" className="scroll-mt-14">
        <QualityGateCard />
      </div>

      <div id="more" className="scroll-mt-14 flex flex-col gap-4">
        <WeeklyReviewCard />
        <BrandPanelCard />
        <DataBridgeCard />
        <RetireCard />
      </div>

      <footer className="mt-2 px-1 text-center text-[11px] text-neutral2-500">
        入力はこの端末に自動保存されます（localStorage）。
      </footer>

      <SaveToast />
    </main>
  );
}

export default function App() {
  const hash = useHashRoute();
  const isDashboard = hash === "#/dashboard" || hash === "#dashboard";
  const isCaseStudy = hash === "#/case-study" || hash === "#case-study";
  return isDashboard ? <Dashboard /> : isCaseStudy ? <CaseStudy /> : <Landing />;
}
