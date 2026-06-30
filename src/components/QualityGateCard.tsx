import { useState } from "react";
import Card from "./Card";
import type { QualityGate, QualityGateRecord, Verdict } from "../types";
import { makeId, useLocalStorage } from "../hooks/useLocalStorage";

// 採用判定の4観点（部下 / 消費者 / 勝算 / 安全）。各3項目。
const GROUPS: { title: string; items: { key: string; label: string }[] }[] = [
  {
    title: "部下視点",
    items: [
      { key: "canBuild", label: "実装できる" },
      { key: "lightOps", label: "運用が重すぎない" },
      { key: "robust", label: "壊れにくい" },
    ],
  },
  {
    title: "消費者視点",
    items: [
      { key: "clear", label: "分かりやすい" },
      { key: "wanted", label: "欲しいと思える" },
      { key: "comfortable", label: "違和感が少ない" },
    ],
  },
  {
    title: "勝算",
    items: [
      { key: "strength", label: "強みがある" },
      { key: "brandFit", label: "Shizuku Studio に合う" },
      { key: "reusable", label: "次に使える" },
    ],
  },
  {
    title: "安全",
    items: [
      { key: "privacy", label: "個人情報OK" },
      { key: "rights", label: "権利OK" },
      { key: "revertible", label: "戻せる" },
    ],
  },
];

// 判定ボタン（採用 / 保留 / 捨てる）
const VERDICTS: { value: Verdict; label: string }[] = [
  { value: "adopt", label: "採用" },
  { value: "hold", label: "保留" },
  { value: "drop", label: "捨てる" },
];

const VERDICT_LABEL: Record<Verdict, string> = { adopt: "採用", hold: "保留", drop: "捨てる" };
// 履歴の判定バッジ色（採用＝氷色 / 保留＝水色 / 捨てる＝灰）
const VERDICT_TAG: Record<Verdict, string> = {
  adopt: "bg-crystal-200 text-accent-600",
  hold: "bg-main-200 text-accent-600",
  drop: "bg-neutral2-100 text-neutral2-300",
};

const EMPTY: QualityGate = { name: "", checks: {}, verdict: null, next: "" };

// 保存日時の文字列（new Date はボタン押下時のみ＝ユーザー操作で確定）
function stamp(): string {
  const d = new Date();
  const p = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 履歴を Obsidian 向け Markdown（frontmatter付き・CLAUDE.md §8）に変換。
function toObsidianMarkdown(history: QualityGateRecord[]): string {
  const d = new Date();
  const created = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
  const lines = [
    "---",
    "tags:",
    "  - ShizukuOS",
    "  - QualityGate",
    `created: ${created}`,
    "---",
    "",
    "# Quality Gate 判定ログ",
    "",
  ];
  for (const r of history) {
    lines.push(`- **${r.name}** — ${VERDICT_LABEL[r.verdict]}（${r.savedAt}）`);
    if (r.next) lines.push(`  - 次の一手: ${r.next}`);
  }
  return lines.join("\n");
}

// 履歴1件を、チェック状態まで含む詳細 Markdown に変換（Obsidian貼り付け用）。
function toRecordMarkdown(r: QualityGateRecord): string {
  const lines = [
    `# Quality Gate Log｜${r.name}`,
    "",
    `- 保存日時：${r.savedAt}`,
    `- 判定：${VERDICT_LABEL[r.verdict]}`,
    "",
  ];
  for (const g of GROUPS) {
    lines.push(`## ${g.title}`);
    for (const item of g.items) {
      lines.push(`- [${r.checks[item.key] ? "x" : " "}] ${item.label}`);
    }
    lines.push("");
  }
  lines.push("## 次の一手", r.next || "（未記入）");
  return lines.join("\n");
}

// AIが出した案・制作物を「採用していいか」判定し、履歴として残すカード。
export default function QualityGateCard() {
  const [gate, setGate] = useLocalStorage<QualityGate>("shizuku.qualityGate", EMPTY);
  const [history, setHistory] = useLocalStorage<QualityGateRecord[]>(
    "shizuku.qualityGateHistory",
    [],
  );
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  const passed = Object.values(gate.checks).filter(Boolean).length;

  const toggle = (key: string) =>
    setGate({ ...gate, checks: { ...gate.checks, [key]: !gate.checks[key] } });

  const setVerdict = (value: Verdict) =>
    setGate({ ...gate, verdict: gate.verdict === value ? null : value });

  // 現在の判定を履歴に保存し、入力欄は次の案のためにリセット。
  const saveToHistory = () => {
    if (!gate.name.trim()) {
      alert("案・制作物の名前を入力してください。入力内容は消えていません。");
      return;
    }
    if (!gate.verdict) {
      alert("採用 / 保留 / 捨てる のいずれかを選んでください。");
      return;
    }
    const record: QualityGateRecord = {
      id: makeId(),
      name: gate.name.trim(),
      checks: gate.checks,
      verdict: gate.verdict,
      next: gate.next.trim(),
      savedAt: stamp(),
    };
    setHistory([record, ...history]);
    setGate(EMPTY); // 次の案へ
  };

  const removeRecord = (id: string) =>
    setHistory(history.filter((r) => r.id !== id));

  // 履歴を Obsidian用 Markdown でクリップボードへコピー（外部送信なし）。
  const copyMarkdown = async () => {
    const md = toObsidianMarkdown(history);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // クリップボードが使えない環境向けフォールバック
      window.prompt("このテキストを選択してコピーし、Obsidianに貼ってください：", md);
    }
  };

  // 履歴1件を詳細Markdown（チェック状態つき）でコピー。
  const copyRecord = async (r: QualityGateRecord) => {
    const md = toRecordMarkdown(r);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      window.prompt(
        "コピーできませんでした。このテキストを手動でコピーしてObsidianに貼ってください：",
        md,
      );
    }
  };

  return (
    <Card eyebrow="Quality Gate" title="採用していい？を判定">
      <input
        value={gate.name}
        onChange={(e) => setGate({ ...gate, name: e.target.value })}
        placeholder="案・制作物の名前…"
        className="w-full rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
      />

      <div className="mt-4 flex flex-col gap-4">
        {GROUPS.map((group) => (
          <fieldset key={group.title}>
            <legend className="mb-2 text-xs font-medium text-accent-500">
              {group.title}
            </legend>
            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl bg-main-50 px-3 py-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={!!gate.checks[item.key]}
                    onChange={() => toggle(item.key)}
                    className="h-4 w-4 shrink-0 accent-accent-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <p className="mt-4 text-xs text-accent-600">
        満たした項目：{passed} / {total}
      </p>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {VERDICTS.map((v) => {
          const active = gate.verdict === v.value;
          return (
            <button
              key={v.value}
              onClick={() => setVerdict(v.value)}
              className={`min-h-[44px] rounded-xl border py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-transparent bg-accent-500 text-white"
                  : "border-main-200 bg-white text-ink hover:border-accent-300"
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-medium text-accent-500">
          次の一手
        </span>
        <textarea
          value={gate.next}
          onChange={(e) => setGate({ ...gate, next: e.target.value })}
          rows={2}
          placeholder="採用・保留・捨てる、の次にやること…"
          className="w-full resize-none rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
        />
      </label>

      <button
        onClick={saveToHistory}
        className="mt-3 min-h-[44px] w-full rounded-xl bg-accent-500 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
      >
        履歴に保存
      </button>

      {/* Quality Gate 履歴（v0.2）＋ Obsidian出力（v0.3） */}
      <div className="mt-6 border-t border-neutral2-200 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-accent-500">判定履歴</p>
          {history.length > 0 && (
            <button
              onClick={copyMarkdown}
              className="min-h-[36px] rounded-lg border border-main-300 px-3 text-xs text-accent-600 transition-colors hover:bg-main-100"
            >
              {copied ? "コピーしました" : "Obsidian用にコピー"}
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs leading-relaxed text-neutral2-300">
            まだ判定履歴がありません。
            <br />
            案を判定して「履歴に保存」を押すと、過去の採用・保留・捨てるが残ります。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((r) => (
              <li key={r.id} className="rounded-2xl bg-main-50 px-3 py-2.5 text-sm">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="font-medium text-ink">{r.name}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${VERDICT_TAG[r.verdict]}`}>
                      {VERDICT_LABEL[r.verdict]}
                    </span>
                    <button
                      onClick={() => copyRecord(r)}
                      className="rounded-md border border-main-300 px-2 py-1 text-[11px] text-accent-600 transition-colors hover:bg-main-100"
                    >
                      {copiedId === r.id ? "済" : "MD"}
                    </button>
                    <button
                      onClick={() => removeRecord(r.id)}
                      aria-label="履歴を削除"
                      className="text-neutral2-300 transition-colors hover:text-accent-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {r.next && <p className="text-xs text-ink">→ {r.next}</p>}
                <p className="mt-1 text-[11px] text-neutral2-300">{r.savedAt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
