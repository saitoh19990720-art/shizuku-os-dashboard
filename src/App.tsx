import { type ReactNode, useEffect, useRef, useState } from "react";
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
  { id: "today", label: "今日", accessibleLabel: "今日：次にやる一つと制作候補へ移動" },
  { id: "log", label: "夜ログ", accessibleLabel: "夜ログ：夜の振り返りへ移動" },
  { id: "gate", label: "採用判定", accessibleLabel: "採用判定：この案を採用する？へ移動" },
  { id: "more", label: "道具", accessibleLabel: "道具：制作中リンクとデータ入出力へ移動" },
] as const;

type SectionId = (typeof NAV)[number]["id"];
const NAV_TARGET_ORDER: readonly SectionId[] = ["today", "gate", "log", "more"];

// 固定ナビの下端より上に来た最後のセクションを「いま見ている場所」とする。
const NAV_OFFSET = 96;
const SCROLL_KEYS = ["Home", "End", "PageUp", "PageDown", "ArrowUp", "ArrowDown", " "];
function useActiveSection(): [SectionId, (id: SectionId) => void] {
  const [active, setActive] = useState<SectionId>("today");
  const endNavigation = useRef<{ id: SectionId; arrived: boolean } | null>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      const navigation = endNavigation.current;
      if (remaining <= 2 && window.scrollY > 0) {
        if (navigation) navigation.arrived = true;
        setActive(navigation?.id ?? "more");
        return;
      }
      if (navigation?.arrived && remaining > 8) endNavigation.current = null;
      let current: SectionId = "today";
      for (const id of NAV_TARGET_ORDER) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= NAV_OFFSET) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const cancelPendingNavigation = () => {
      if (endNavigation.current && !endNavigation.current.arrived) endNavigation.current = null;
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0 && !event.ctrlKey) cancelPendingNavigation();
    };
    const onScrollKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !SCROLL_KEYS.includes(event.key)) return;
      const target = event.target;
      if (target instanceof Element) {
        if (target.closest("input, textarea, select") || (target instanceof HTMLElement && target.isContentEditable)) return;
        if (event.key === " " && target.closest("button, [role='button']")) return;
      }
      cancelPendingNavigation();
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", cancelPendingNavigation, { passive: true });
    window.addEventListener("keydown", onScrollKey);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", cancelPendingNavigation);
      window.removeEventListener("keydown", onScrollKey);
    };
  }, []);
  return [active, (id) => {
    const root = document.documentElement;
    const target = document.getElementById(id);
    const maxScroll = root.scrollHeight - window.innerHeight;
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    // 複数の移動先が同じ末尾位置に着く場合は、押した項目を保持する。
    const reachesEnd = target && target.getBoundingClientRect().top + window.scrollY - padding >= maxScroll - 2;
    endNavigation.current = reachesEnd ? { id, arrived: window.scrollY >= maxScroll - 2 } : null;
    setActive(id);
    scrollToSection(id);
  }];
}

function DashboardSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="flex flex-col gap-2 rounded-card border border-main-200/90 bg-white/60 p-2"
    >
      <header className="px-2 py-1">
        <h2 id={`${id}-heading`} className="text-base font-semibold text-ink">{title}</h2>
        <p className="text-xs text-neutral2-500">{description}</p>
      </header>
      {children}
    </section>
  );
}

// Shizuku OS Dashboard 本体。
// 主カード（制作候補／夜の振り返り）は開、採用判定と二次カードは初回畳み。
// 上部に初回案内 ＋ sticky ナビ。
function Dashboard() {
  const [active, navigateToSection] = useActiveSection();
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col gap-4 px-4 pb-16 pt-8">
      <header className="mb-1 px-1">
        <a
          href="#/"
          className="mb-3 inline-flex min-h-[44px] items-center text-sm text-ink underline-offset-2 hover:underline"
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
                  onClick={() => navigateToSection(item.id)}
                  aria-label={item.accessibleLabel}
                  aria-current={selected ? "location" : undefined}
                  className={`flex min-h-[44px] w-full items-center justify-center rounded-xl border px-1 text-xs transition-colors ${
                    selected
                      ? "border-accent-300/60 bg-crystal-100 font-semibold text-ink"
                      : "border-transparent font-medium text-ink hover:bg-main-100"
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

      <DashboardSection id="north-star" title="North Star" description="制作の方向性">
        <WeeklyReviewCard />
        <BrandPanelCard />
      </DashboardSection>

      <DashboardSection id="today" title="Current" description="今日の状況と次の行動">
        <NextActionCard />
        <TaskCard />
        <ConditionCard />
      </DashboardSection>

      <DashboardSection id="bottleneck" title="Bottleneck" description="進行を止めていること">
        <p className="rounded-xl border border-dashed border-main-200 px-3 py-2 text-sm text-neutral2-500">
          既存カードなし
        </p>
      </DashboardSection>

      <DashboardSection id="gate" title="Decisions" description="採用の判断">
        <QualityGateCard />
      </DashboardSection>

      <DashboardSection id="ai-office" title="AI Office" description="AIへの依頼と使い分け">
        <RoleRouterCard />
        <PromptBuilderCard />
      </DashboardSection>

      <DashboardSection id="log" title="Resume" description="記録と再開">
        <NightLogCard />
        <RetireCard />
        <div id="more" className="flex flex-col gap-2">
          <div className="[&_input.grow]:min-w-0">
            <LinksCard />
          </div>
          <DataBridgeCard />
        </div>
      </DashboardSection>

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
