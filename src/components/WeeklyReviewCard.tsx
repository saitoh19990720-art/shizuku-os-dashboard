import { useState } from "react";
import Card from "./Card";
import { makeId, useLocalStorage } from "../hooks/useLocalStorage";

// Weekly Review：1週間の やった/学び/次/来週の重点 を書いて貯める。
// 3〜5分で書ける軽さ。Obsidian用Markdownでコピー可（循環OS §10）。
interface WeeklyReview {
  id: string;
  week: string;
  did: string;
  learned: string;
  next: string;
  focus: string;
  savedAt: string;
}

const FIELDS: { key: keyof Omit<WeeklyReview, "id" | "savedAt">; label: string; placeholder: string; rows: number }[] = [
  { key: "week", label: "対象の週", placeholder: "例：2026-07 第1週 / W27", rows: 1 },
  { key: "did", label: "今週やったこと", placeholder: "・", rows: 2 },
  { key: "learned", label: "今週学んだこと", placeholder: "・", rows: 2 },
  { key: "next", label: "次にやること", placeholder: "・", rows: 2 },
  { key: "focus", label: "来週の重点（最初の1つ）", placeholder: "来週いちばん進めること", rows: 1 },
];

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function toMarkdown(r: WeeklyReview): string {
  return [
    "---",
    "tags:",
    "  - shizuku-studio",
    "  - weekly-review",
    `week: ${r.week || "-"}`,
    "---",
    "",
    `# Weekly Review｜${r.week || "(週未記入)"}`,
    "",
    "## 今週やったこと",
    r.did || "-",
    "",
    "## 今週学んだこと",
    r.learned || "-",
    "",
    "## 次にやること",
    r.next || "-",
    "",
    "## 来週の重点",
    r.focus || "-",
  ].join("\n");
}

const EMPTY = { week: "", did: "", learned: "", next: "", focus: "" };

export default function WeeklyReviewCard() {
  const [form, setForm] = useState(EMPTY);
  const [reviews, setReviews] = useLocalStorage<WeeklyReview[]>("shizuku.weeklyReviews", []);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const set = (key: keyof typeof EMPTY, value: string) => setForm({ ...form, [key]: value });

  const save = () => {
    if (!form.did.trim() && !form.learned.trim() && !form.next.trim()) {
      alert("「やった / 学び / 次にやること」のどれかを書いてください。");
      return;
    }
    setReviews([{ id: makeId(), ...form, week: form.week.trim(), savedAt: stamp() }, ...reviews]);
    setForm(EMPTY);
  };
  const remove = (id: string) => setReviews(reviews.filter((r) => r.id !== id));
  const copyMd = async (r: WeeklyReview) => {
    const md = toMarkdown(r);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      window.prompt("このテキストをコピーしてObsidianに貼ってください：", md);
    }
  };

  return (
    <Card eyebrow="Weekly Review" title="週次の振り返り" defaultOpen={false}>
      <p className="mb-3 text-xs text-neutral2-500">3〜5分で軽く。完璧な分析じゃなく、制作感覚を残す。</p>
      <div className="flex flex-col gap-2.5">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-accent-500">{f.label}</span>
            <textarea
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              rows={f.rows}
              placeholder={f.placeholder}
              className="resize-none rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
            />
          </label>
        ))}
        <button
          onClick={save}
          className="mt-1 min-h-[44px] rounded-xl bg-accent-500 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
        >
          今週分を保存
        </button>
      </div>

      <div className="mt-5 border-t border-neutral2-200 pt-4">
        <p className="mb-2 text-xs font-medium text-accent-500">これまでの振り返り</p>
        {reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs leading-relaxed text-neutral2-500">
            まだ週次レビューがありません。
            <br />
            週の終わりに「やった／学び／次」を数行だけ残すと、ここに貯まります。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl bg-main-50 px-3 py-2.5 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-ink">{r.week || "（週未記入）"}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => copyMd(r)}
                      className="min-h-[32px] rounded-md border border-main-300 px-2 text-[11px] text-accent-600 transition-colors hover:bg-main-100"
                    >
                      {copiedId === r.id ? "済" : "MD"}
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      aria-label={`${r.week || "週未記入"} のレビューを削除`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral2-500 transition-colors hover:bg-white/70 hover:text-accent-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {r.did && <p className="text-xs text-ink">🌙 {r.did}</p>}
                {r.focus && <p className="text-xs text-accent-600">→ 来週：{r.focus}</p>}
                <p className="mt-1 text-[10px] text-neutral2-500">{r.savedAt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
