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
import { scrollToSection } from "./lib/scrollToSection";

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
  { id: "today", label: "今日", accessibleLabel: "今日：制作候補へ移動" },
  { id: "log", label: "夜ログ", accessibleLabel: "夜ログ：夜の振り返りへ移動" },
  { id: "gate", label: "採用判定", accessibleLabel: "採用判定：この案を採用する？へ移動" },
  { id: "more", label: "道具", accessibleLabel: "道具：制作中リンクなど補助カードへ移動" },
] as const;

type SectionId = (typeof NAV)[number]["id"];

// 固定ナビの下端より上に来た最後のセクションを「いま見ている場所」とする。
// ページ末尾まで来たら、最後のセクション（道具）を選ぶ。
const NAV_OFFSET = 96;
function useActiveSection(): [SectionId, (id: SectionId) => void] {
  const [active, setActive] = useState<SectionId>("today");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && window.scrollY > 0) {
        setActive(NAV[NAV.length - 1].id);
        return;
      }
      let current: SectionId = NAV[0].id;
      for (const item of NAV) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= NAV_OFFSET) current = item.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return [active, setActive];
}

// Shizuku OS Dashboard 本体。
// 主カード（制作候補／夜の振り返り）は開、採用判定と二次カードは初回畳み。
// 上部に初回案内 ＋ sticky ナビ。
function Dashboard() {
  const [active, setActive] = useActiveSection();
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col gap-4 px-4 pb-16 pt-8">
      <header className="mb-1 px-1">
        <a
          href="#/"
          className="mb-3 inline-flex min-h-[44px] items-center text-sm text-accent-600 transition-colors hover:text-accent-500"
        >
          ← Shizuku OS について
        </a>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral2-500">
          Shizuku OS
        </p>
        <h1 className="font-mincho text-2xl font-semibold text-ink">しずくの仕事机</h1>
        <p className="mt-1 text-sm text-neutral2-500">
          今日つくるものを決めて、明日の一手を残す。
        </p>
      </header>

      {/* sticky ミニナビ（モバイルで主WFへすぐ戻る） */}
      <nav
        aria-label="セクション"
        className="sticky top-0 z-20 -mx-4 border-b border-main-200/90 bg-[#f7f8fc]/92 px-4 py-2 backdrop-blur-md"
      >
        <ul className="flex items-center gap-1">
          {NAV.map((item) => {
            const selected = active === item.id;
            return (
              <li key={item.id} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setActive(item.id);
                    scrollToSection(item.id);
                  }}
                  aria-label={item.accessibleLabel}
                  aria-current={selected ? "location" : undefined}
                  className={`flex min-h-[44px] w-full items-center justify-center rounded-xl border px-1 text-xs transition-colors ${
                    selected
                      ? "border-accent-300/60 bg-crystal-100 font-semibold text-accent-600"
                      : "border-transparent font-medium text-accent-600 hover:bg-main-100"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <StorageAlert />
      <StartHereBanner />

      <div id="today" className="flex scroll-mt-20 flex-col gap-4">
        <TaskCard />
        <ConditionCard />
        <NextActionCard />
      </div>

      <div id="log" className="flex scroll-mt-20 flex-col gap-4">
        <NightLogCard />
        <RetireCard />
      </div>

      <div id="gate" className="scroll-mt-20">
        <QualityGateCard />
      </div>

      <div id="more" className="flex scroll-mt-20 flex-col gap-4">
        <LinksCard />
        <RoleRouterCard />
        <PromptBuilderCard />
        <WeeklyReviewCard />
        <BrandPanelCard />
        <DataBridgeCard />
      </div>

      <footer className="mt-2 px-1 text-center text-xs text-neutral2-500">
        このブラウザ内に保存されます。端末間の同期はありません。
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
