import { useState } from "react";
import Card from "./Card";
import { useLocalStorage } from "../hooks/useLocalStorage";

// Prompt Builder：目的・制約・出力形式・優先順位・やらないこと を入れると、
// Claude/ChatGPT等に貼れるプロンプト文を生成する。入力はlocalStorageに保存。
interface PromptFields {
  purpose: string;
  constraints: string;
  format: string;
  priority: string;
  avoid: string;
}

const EMPTY: PromptFields = {
  purpose: "",
  constraints: "",
  format: "",
  priority: "",
  avoid: "",
};

const FIELDS: { key: keyof PromptFields; label: string; placeholder: string }[] = [
  { key: "purpose", label: "目的", placeholder: "何を達成したいか" },
  { key: "constraints", label: "制約", placeholder: "触らない所・使わない物・前提" },
  { key: "format", label: "出力形式", placeholder: "コード＋説明 / 箇条書き / 表 など" },
  { key: "priority", label: "優先順位", placeholder: "何を最優先にするか" },
  { key: "avoid", label: "やらないこと", placeholder: "してほしくないこと" },
];

const SECTION_TITLE: Record<keyof PromptFields, string> = {
  purpose: "目的",
  constraints: "制約",
  format: "出力形式",
  priority: "優先順位",
  avoid: "やらないこと",
};

function buildPrompt(f: PromptFields): string {
  return (Object.keys(f) as (keyof PromptFields)[])
    .filter((k) => f[k].trim())
    .map((k) => `# ${SECTION_TITLE[k]}\n${f[k].trim()}`)
    .join("\n\n");
}

export default function PromptBuilderCard() {
  const [fields, setFields] = useLocalStorage<PromptFields>(
    "shizuku.promptBuilder",
    EMPTY,
  );
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(fields);

  const set = (key: keyof PromptFields, value: string) =>
    setFields({ ...fields, [key]: value });

  const copy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("このテキストを選択してコピーしてください：", prompt);
    }
  };

  const clear = () => setFields(EMPTY);

  return (
    <Card eyebrow="Prompt Builder" title="プロンプトを組む">
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

      <div className="mt-4 border-t border-neutral2-200 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-accent-500">生成プロンプト</p>
          <div className="flex items-center gap-2">
            {prompt && (
              <button
                onClick={clear}
                className="min-h-[36px] rounded-lg px-2 text-xs text-neutral2-300 transition-colors hover:text-accent-500"
              >
                クリア
              </button>
            )}
            <button
              onClick={copy}
              disabled={!prompt}
              className="min-h-[36px] rounded-lg border border-main-300 px-3 text-xs text-accent-600 transition-colors hover:bg-main-100 disabled:opacity-40"
            >
              {copied ? "コピーしました" : "コピー"}
            </button>
          </div>
        </div>
        {prompt ? (
          <textarea
            value={prompt}
            readOnly
            rows={6}
            className="w-full resize-none rounded-xl border border-main-200 bg-main-50 px-3 py-2 text-xs text-ink outline-none"
          />
        ) : (
          <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs leading-relaxed text-neutral2-300">
            上の欄を埋めると、ここにコピーできるプロンプトが出ます。
          </p>
        )}
      </div>
    </Card>
  );
}
