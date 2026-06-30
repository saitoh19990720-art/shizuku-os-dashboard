import { useState } from "react";
import Card from "./Card";
import type { Priority, Task } from "../types";
import { makeId, useLocalStorage } from "../hooks/useLocalStorage";

// 優先度バッジの色分け（A=締め色 / B=中間 / C=薄色）
const PRIORITY_STYLE: Record<Priority, string> = {
  A: "bg-accent-500 text-white",
  B: "bg-accent-300 text-white",
  C: "bg-main-200 text-accent-600",
};

// 初期表示の制作候補（3つ）
const DEFAULT_TASKS: Task[] = [
  { id: makeId(), title: "ポートフォリオLPの文言を整える", priority: "A", done: false },
  { id: makeId(), title: "Figmaの3カードを微調整", priority: "B", done: false },
  { id: makeId(), title: "Obsidianに今日の結論を残す", priority: "C", done: false },
];

export default function TaskCard() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("shizuku.tasks", DEFAULT_TASKS);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("B");

  const addTask = () => {
    const text = title.trim();
    if (!text) return;
    setTasks([...tasks, { id: makeId(), title: text, priority, done: false }]);
    setTitle("");
    setPriority("B");
  };

  const toggle = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <Card eyebrow="Today" title="今日の制作候補">
      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-2xl bg-main-50 px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggle(task.id)}
              className="h-4 w-4 shrink-0 accent-accent-500"
            />
            <span
              className={`grow text-sm ${
                task.done ? "text-neutral2-300 line-through" : "text-ink"
              }`}
            >
              {task.title}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[task.priority]}`}
            >
              {task.priority}
            </span>
            <button
              onClick={() => remove(task.id)}
              aria-label="削除"
              className="shrink-0 text-neutral2-300 transition-colors hover:text-accent-500"
            >
              ×
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="py-3 text-center text-sm text-neutral2-300">
            候補がありません。下から追加できます。
          </li>
        )}
      </ul>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="やることを書く…"
            className="grow rounded-xl border border-main-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-300"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded-xl border border-main-200 bg-white px-2 py-2 text-sm outline-none focus:border-accent-300"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
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
