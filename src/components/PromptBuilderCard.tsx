import { useState } from "react";
import Card from "./Card";
import { makeId, useLocalStorage } from "../hooks/useLocalStorage";

// Prompt Builder＋Vault：プロンプトを組んで生成し、名前をつけて保存・再利用する。
// 8枚目カードを作らず、この1枚に「生成」と「保管庫」を集約（画面を混ませない）。
interface PromptFields {
  purpose: string;
  constraints: string;
  format: string;
  priority: string;
  avoid: string;
}
interface SavedPrompt {
  id: string;
  name: string;
  targetAI: string;
  body: string;
  favorite: boolean;
  savedAt: string;
}

const EMPTY: PromptFields = { purpose: "", constraints: "", format: "", priority: "", avoid: "" };

const FIELDS: { key: keyof PromptFields; label: string; placeholder: string }[] = [
  { key: "purpose", label: "目的", placeholder: "何を達成したいか" },
  { key: "constraints", label: "制約", placeholder: "触らない所・使わない物・前提" },
  { key: "format", label: "出力形式", placeholder: "コード＋説明 / 箇条書き / 表 など" },
  { key: "priority", label: "優先順位", placeholder: "何を最優先にするか" },
  { key: "avoid", label: "やらないこと", placeholder: "してほしくないこと" },
];
const SECTION_TITLE: Record<keyof PromptFields, string> = {
  purpose: "目的", constraints: "制約", format: "出力形式", priority: "優先順位", avoid: "やらないこと",
};
const TARGET_AIS = ["Claude", "ChatGPT", "Figma", "n8n", "Codex", "Other"];

function buildPrompt(f: PromptFields): string {
  return (Object.keys(f) as (keyof PromptFields)[])
    .filter((k) => f[k].trim())
    .map((k) => `# ${SECTION_TITLE[k]}\n${f[k].trim()}`)
    .join("\n\n");
}
function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PromptBuilderCard() {
  const [fields, setFields] = useLocalStorage<PromptFields>("shizuku.promptBuilder", EMPTY);
  const [saved, setSaved] = useLocalStorage<SavedPrompt[]>("shizuku.promptVault", []);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetAI, setTargetAI] = useState("Claude");
  const [filterAI, setFilterAI] = useState("すべて");
  const [favOnly, setFavOnly] = useState(false);

  const prompt = buildPrompt(fields);
  const set = (key: keyof PromptFields, value: string) => setFields({ ...fields, [key]: value });

  const copyText = async (text: string, onOk: () => void) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      onOk();
    } catch {
      window.prompt("このテキストを選択してコピーしてください：", text);
    }
  };

  const saveToVault = () => {
    if (!prompt) return;
    if (!name.trim()) {
      alert("プロンプト名を入力してください。");
      return;
    }
    setSaved([
      { id: makeId(), name: name.trim(), targetAI, body: prompt, favorite: false, savedAt: stamp() },
      ...saved,
    ]);
    setName("");
  };
  const toggleFav = (id: string) =>
    setSaved(saved.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)));
  const removeSaved = (id: string) => setSaved(saved.filter((s) => s.id !== id));

  const shown = saved
    .filter((s) => filterAI === "すべて" || s.targetAI === filterAI)
    .filter((s) => !favOnly || s.favorite);

  return (
    <Card eyebrow="Prompt Builder" title="プロンプトを組む・貯める" defaultOpen={false}>
      <div className="flex flex-col gap-2.5">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-accent-500">{f.label}</span>
            <textarea
              value={fields[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              rows={f.key === "purpose" ? 2 : 1}
              placeholder={f.placeholder}
              className="resize-none rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
            />
          </label>
        ))}
      </div>

      {/* 生成 */}
      <div className="mt-4 border-t border-neutral2-200 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-accent-500">生成プロンプト</p>
          <button
            onClick={() => copyText(prompt, () => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}
            disabled={!prompt}
            className="min-h-[36px] rounded-lg border border-main-300 px-3 text-xs text-accent-600 transition-colors hover:bg-main-100 disabled:opacity-40"
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
        {prompt ? (
          <textarea value={prompt} readOnly rows={5}
            className="w-full resize-none rounded-xl border border-main-200 bg-main-50 px-3 py-2 text-xs text-ink outline-none" />
        ) : (
          <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs leading-relaxed text-neutral2-300">
            上の欄を埋めると、ここにコピーできるプロンプトが出ます。
          </p>
        )}

        {/* 保存フォーム */}
        {prompt && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロンプト名"
              className="min-w-0 flex-1 rounded-xl border border-main-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-300"
            />
            <select
              value={targetAI}
              onChange={(e) => setTargetAI(e.target.value)}
              className="rounded-xl border border-main-200 bg-white px-2 py-2 text-sm outline-none focus:border-accent-300"
            >
              {TARGET_AIS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button
              onClick={saveToVault}
              className="min-h-[44px] rounded-xl bg-accent-500 px-4 text-sm font-medium text-white transition-colors hover:bg-accent-600"
            >
              保存
            </button>
          </div>
        )}
      </div>

      {/* Vault（保管庫） */}
      <div className="mt-6 border-t border-neutral2-200 pt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-accent-500">保存したプロンプト</p>
          {saved.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={filterAI}
                onChange={(e) => setFilterAI(e.target.value)}
                className="rounded-lg border border-main-300 bg-white px-2 py-1 text-[11px] text-accent-600 outline-none"
              >
                {["すべて", ...TARGET_AIS].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button
                onClick={() => setFavOnly((v) => !v)}
                aria-pressed={favOnly}
                aria-label="お気に入りだけ表示"
                className={`min-h-[28px] rounded-lg border px-2 text-[11px] transition-colors ${
                  favOnly ? "border-transparent bg-accent-500 text-white" : "border-main-300 bg-white text-accent-600"
                }`}
              >
                ★のみ
              </button>
            </div>
          )}
        </div>
        {saved.length === 0 ? (
          <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs leading-relaxed text-neutral2-300">
            まだ保存したプロンプトがありません。
            <br />
            上で組んだプロンプトに名前をつけて「保存」すると、ここに貯まります。
          </p>
        ) : shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs text-neutral2-300">
            条件に合う保存プロンプトがありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shown.map((s) => (
              <li key={s.id} className="rounded-2xl bg-main-50 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      onClick={() => toggleFav(s.id)}
                      aria-pressed={s.favorite}
                      aria-label={`${s.name} をお気に入りにする`}
                      className={`shrink-0 text-sm ${s.favorite ? "text-accent-500" : "text-neutral2-300"}`}
                    >
                      ★
                    </button>
                    <span className="truncate font-medium text-ink">{s.name}</span>
                    <span className="shrink-0 rounded-full bg-crystal-200 px-2 py-0.5 text-[10px] text-accent-600">{s.targetAI}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => copyText(s.body, () => { setCopiedId(s.id); setTimeout(() => setCopiedId(null), 1600); })}
                      className="min-h-[32px] rounded-md border border-main-300 px-2 text-[11px] text-accent-600 transition-colors hover:bg-main-100"
                    >
                      {copiedId === s.id ? "済" : "コピー"}
                    </button>
                    <button
                      onClick={() => removeSaved(s.id)}
                      aria-label={`${s.name} を削除`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral2-300 transition-colors hover:bg-white/70 hover:text-accent-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-neutral2-300">{s.savedAt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
