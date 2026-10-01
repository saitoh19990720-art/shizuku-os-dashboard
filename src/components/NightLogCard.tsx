import { useState } from "react";
import Card from "./Card";
import type { NightLog } from "../types";
import { makeId, useLocalStorage } from "../hooks/useLocalStorage";

// 「やった / 学び / 次やる」の3行を1日分として記録するカード。
export default function NightLogCard() {
  const [logs, setLogs] = useLocalStorage<NightLog[]>("shizuku.nightLogs", []);
  const [did, setDid] = useState("");
  const [learned, setLearned] = useState("");
  const [next, setNext] = useState("");

  // 日付文字列を作る（new Date は記録ボタン押下時のみ＝ユーザー操作で確定）
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const save = () => {
    if (!did.trim() && !learned.trim() && !next.trim()) return;
    const entry: NightLog = {
      id: makeId(),
      date: today(),
      did: did.trim(),
      learned: learned.trim(),
      next: next.trim(),
    };
    setLogs([entry, ...logs]); // 新しい順に積む
    setDid("");
    setLearned("");
    setNext("");
  };

  const remove = (id: string) => {
    const target = logs.find((l) => l.id === id);
    if (!window.confirm(`${target?.date || "この"}ログを削除しますか？`)) return;
    setLogs(logs.filter((l) => l.id !== id));
  };

  const fields = [
    { label: "やった", value: did, set: setDid, placeholder: "今日やったこと" },
    { label: "学び", value: learned, set: setLearned, placeholder: "気づき・学び" },
    { label: "次やる", value: next, set: setNext, placeholder: "次の一手" },
  ];

  return (
    <Card eyebrow="Night log" title="夜の振り返り" storageTitle="夜タスク3行ログ">
      <div className="flex flex-col gap-2.5">
        {fields.map((f) => (
          <label key={f.label} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-accent-600">{f.label}</span>
            <input
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="min-h-[44px] rounded-xl border border-[#767676] bg-white px-3 py-2 text-sm text-ink placeholder:text-neutral2-500 placeholder:opacity-100 outline-none focus:border-accent-600"
            />
          </label>
        ))}
        <button
          onClick={save}
          className="mt-1 min-h-[44px] rounded-xl bg-accent-600 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3f65a6]"
        >
          ログを記録
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-sm leading-relaxed text-neutral2-500">
          一行からで大丈夫。
          <br />
          今日の記録を、明日の一手につなげる。
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {logs.map((log) => (
            <li key={log.id} className="rounded-2xl bg-crystal-300 px-3 py-2.5 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-accent-600">{log.date}</span>
                <button
                  type="button"
                  onClick={() => remove(log.id)}
                  aria-label={`${log.date} のログを削除`}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-neutral2-500 transition-colors hover:bg-white/70 hover:text-accent-600"
                >
                  ×
                </button>
              </div>
              {log.did && <p className="text-ink">🌙 {log.did}</p>}
              {log.learned && <p className="text-ink">💡 {log.learned}</p>}
              {log.next && <p className="text-ink">→ {log.next}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
