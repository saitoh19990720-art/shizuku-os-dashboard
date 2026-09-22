import { useLocalStorage } from "../hooks/useLocalStorage";
import type { NightLog, Task } from "../types";

// TaskCard と同じ初期シード（キー衝突時に先マウント側が中身を潰さないよう一致させる）
const DEFAULT_TASKS: Task[] = [
  { id: "seed-demo-1", title: "ポートフォリオLPの文言を整える", priority: "A", status: "today", done: false, demo: true },
  { id: "seed-demo-2", title: "Figmaの3カードを微調整", priority: "B", status: "tomorrow", done: false, demo: true },
  { id: "seed-demo-3", title: "Obsidianに今日の結論を残す", priority: "C", status: "hold", done: false, demo: true },
];

// 初回導線：制作候補1つ → 夜ログ1行。主WF以外は畳む前提で、上部に1ステップだけ置く。
export default function StartHereBanner() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("shizuku.tasks", DEFAULT_TASKS);
  const [logs] = useLocalStorage<NightLog[]>("shizuku.nightLogs", []);
  const [dismissed, setDismissed] = useLocalStorage<boolean>("shizuku.startHere.dismissed", false);

  const demoTasks = tasks.filter((t) => t.demo);
  const realTasks = tasks.filter((t) => !t.demo);
  const step1Done = realTasks.length > 0;
  const step2Done = logs.length > 0;
  if (dismissed || (step1Done && step2Done)) return null;

  const clearDemo = () => {
    if (demoTasks.length === 0) return;
    if (!window.confirm("デモ用の制作候補を消しますか？（自分で追加したものは残ります）")) return;
    setTasks(tasks.filter((t) => !t.demo));
  };

  return (
    <section
      aria-label="はじめに"
      className="rounded-card border border-accent-300/70 bg-crystal-100 p-4 shadow-soft"
    >
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-600">
        Start here
      </p>
      <h2 className="font-mincho text-base font-semibold text-ink">まずはこの2つだけ</h2>
      <ol className="mt-3 flex flex-col gap-2 text-sm text-ink">
        <li className="flex items-start gap-2">
          <span
            aria-hidden
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              step1Done ? "bg-accent-500 text-white" : "bg-white text-accent-600 ring-1 ring-accent-300"
            }`}
          >
            {step1Done ? "✓" : "1"}
          </span>
          <span>
            <button
              type="button"
              onClick={() =>
                document.getElementById("today")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="inline-flex min-h-6 items-center font-medium text-accent-600 underline-offset-2 hover:underline"
            >
              制作候補を1つ追加
            </button>
            <span className="text-neutral2-500"> → 今日やるものを決める</span>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span
            aria-hidden
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              step2Done ? "bg-accent-500 text-white" : "bg-white text-accent-600 ring-1 ring-accent-300"
            }`}
          >
            {step2Done ? "✓" : "2"}
          </span>
          <span>
            <button
              type="button"
              onClick={() =>
                document.getElementById("log")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="inline-flex min-h-6 items-center font-medium text-accent-600 underline-offset-2 hover:underline"
            >
              夜ログを1行
            </button>
            <span className="text-neutral2-500"> → やった／学び／次やる</span>
          </span>
        </li>
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {demoTasks.length > 0 && (
          <button
            type="button"
            onClick={clearDemo}
            className="min-h-[40px] rounded-xl border border-main-300 bg-white px-3 text-xs font-medium text-accent-600 transition-colors hover:bg-main-100"
          >
            デモデータを消す（{demoTasks.length}件）
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="min-h-[40px] rounded-xl px-3 text-xs text-neutral2-500 underline-offset-2 hover:text-accent-600 hover:underline"
        >
          あとで
        </button>
      </div>
    </section>
  );
}
