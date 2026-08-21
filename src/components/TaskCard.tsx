import { useState } from "react";
import Card from "./Card";
import type { Priority, Task, TaskStatus } from "../types";
import { makeId, useLocalStorage } from "../hooks/useLocalStorage";

// 優先度の表示ラベルと色（A=高 / B=中 / C=低）
const PRIORITY_LABEL: Record<Priority, string> = { A: "高", B: "中", C: "低" };
const PRIORITY_STYLE: Record<Priority, string> = {
  A: "bg-accent-500 text-white",
  B: "bg-accent-300 text-white",
  C: "bg-main-200 text-accent-600",
};

// 状態（Figma準拠：今日/明日/保留）。バッジをタップで巡回。
const STATUS_LABEL: Record<TaskStatus, string> = { today: "今日", tomorrow: "明日", hold: "保留" };
const STATUS_STYLE: Record<TaskStatus, string> = {
  today: "bg-crystal-200 text-accent-600",
  tomorrow: "bg-main-200 text-accent-600",
  hold: "bg-neutral2-100 text-neutral2-300",
};
const STATUS_ORDER: TaskStatus[] = ["today", "tomorrow", "hold"];

const DEFAULT_TASKS: Task[] = [
  { id: makeId(), title: "ポートフォリオLPの文言を整える", priority: "A", status: "today", done: false },
  { id: makeId(), title: "Figmaの3カードを微調整", priority: "B", status: "tomorrow", done: false },
  { id: makeId(), title: "Obsidianに今日の結論を残す", priority: "C", status: "hold", done: false },
];

export default function TaskCard() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("shizuku.tasks", DEFAULT_TASKS);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("B");
  const [status, setStatus] = useState<TaskStatus>("today");

  const addTask = () => {
    const text = title.trim();
    if (!text) return;
    setTasks([...tasks, { id: makeId(), title: text, priority, status, done: false }]);
    setTitle("");
    setPriority("B");
    setStatus("today");
  };

  const toggle = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  // 状態バッジをタップで 今日→明日→保留→今日 と巡回
  const cycleStatus = (id: string) =>
    setTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const cur = (t.status ?? "today") as TaskStatus;
        const next = STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length];
        return { ...t, status: next };
      }),
    );

  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <Card eyebrow="Today" title="今日の制作候補">
      <ul className="flex flex-col gap-2">
        {tasks.map((task) => {
          const st = (task.status ?? "today") as TaskStatus;
          // チェックボックスとタスク名を結びつける（読み上げで「何を完了にするか」が分かる）
          const titleId = `task-title-${task.id}`;
          return (
            <li key={task.id} className="rounded-2xl bg-main-50 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggle(task.id)}
                  aria-labelledby={titleId}
                  className="h-4 w-4 shrink-0 accent-accent-500"
                />
                <span id={titleId} className={`grow text-sm ${task.done ? "text-neutral2-300 line-through" : "text-ink"}`}>
                  {task.title}
                </span>
                <button
                  onClick={() => remove(task.id)}
                  aria-label={`${task.title} を削除`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral2-300 transition-colors hover:bg-main-100 hover:text-accent-500"
                >
                  ×
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2 pl-7">
                <button
                  onClick={() => cycleStatus(task.id)}
                  aria-label={`${task.title} の状態：${STATUS_LABEL[st]}（押すと次の状態へ）`}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${STATUS_STYLE[st]}`}
                >
                  {STATUS_LABEL[st]}
                </button>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[task.priority]}`}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
              </div>
            </li>
          );
        })}
        {tasks.length === 0 && (
          <li className="py-3 text-center text-sm text-neutral2-300">
            候補がありません。下から追加できます。
          </li>
        )}
      </ul>

      <div className="mt-4 flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="今日作るものを書く…"
          className="rounded-xl border border-main-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-300"
        />
        <div className="flex gap-2">
          <label className="flex grow flex-col gap-1">
            <span className="text-[11px] text-neutral2-300">優先度</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="min-h-[40px] rounded-xl border border-main-200 bg-white px-2 text-sm outline-none focus:border-accent-300"
            >
              <option value="A">高</option>
              <option value="B">中</option>
              <option value="C">低</option>
            </select>
          </label>
          <label className="flex grow flex-col gap-1">
            <span className="text-[11px] text-neutral2-300">状態</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="min-h-[40px] rounded-xl border border-main-200 bg-white px-2 text-sm outline-none focus:border-accent-300"
            >
              <option value="today">今日</option>
              <option value="tomorrow">明日</option>
              <option value="hold">保留</option>
            </select>
          </label>
        </div>
        <button
          onClick={addTask}
          className="min-h-[44px] rounded-xl bg-accent-500 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
        >
          候補を追加
        </button>
      </div>
    </Card>
  );
}
