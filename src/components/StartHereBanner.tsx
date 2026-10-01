import { useStoredValue } from "../hooks/useLocalStorage";
import { scrollToSection } from "../lib/scrollToSection";
import type { NightLog, Task } from "../types";

// TaskCard と同じ初期シード。案内は読み取りだけ行い、候補を保存しない。
const DEFAULT_TASKS: Task[] = [
  { id: "seed-demo-1", title: "ポートフォリオLPの文言を整える", priority: "A", status: "today", done: false, demo: true },
  { id: "seed-demo-2", title: "Figmaの3カードを微調整", priority: "B", status: "tomorrow", done: false, demo: true },
  { id: "seed-demo-3", title: "Obsidianに今日の結論を残す", priority: "C", status: "hold", done: false, demo: true },
];

// 初回導線：制作候補1つ → 夜の振り返り1行。主WF以外は畳む前提で、上部に1ステップだけ置く。
// デモ候補の削除は制作候補カード側に1つだけ置く（ここでは重複させない）。
export default function StartHereBanner() {
  const tasks = useStoredValue<Task[]>("shizuku.tasks", DEFAULT_TASKS);
  const logs = useStoredValue<NightLog[]>("shizuku.nightLogs", []);
  // 以前「あとで」で閉じた人には再表示しない（閉じる操作自体は今回の改善案で非表示）。
  const dismissed = useStoredValue<boolean>("shizuku.startHere.dismissed", false);

  const step1Done = tasks.some((t) => !t.demo);
  const step2Done = logs.length > 0;
  if (dismissed || (step1Done && step2Done)) return null;

  const steps = [
    { done: step1Done, target: "today", text: "候補を一つ追加して、今日やることを決める。" },
    { done: step2Done, target: "log", text: "夜に、やったことと次の一手を残す。" },
  ];

  return (
    <section
      aria-labelledby="start-here-title"
      className="rounded-card border border-accent-300/70 bg-crystal-100 p-4 shadow-soft"
    >
      <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-accent-600">はじめに</p>
      <h2 id="start-here-title" className="font-mincho text-base font-semibold text-ink">
        今日の一つを決める
      </h2>
      <ol className="mt-2 flex flex-col text-sm">
        {steps.map((s, i) => (
          <li key={s.target}>
            <button
              type="button"
              onClick={() => scrollToSection(s.target)}
              className="flex min-h-[44px] w-full items-center gap-2 text-left font-medium text-accent-600 underline-offset-2 hover:underline"
            >
              <span
                aria-hidden
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  s.done ? "bg-accent-500 text-white" : "bg-white text-accent-600 ring-1 ring-accent-300"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span>
                {s.text}
                {s.done && <span className="sr-only">（済み）</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
