import { useState } from "react";
import Card from "./Card";
import type { LinkItem } from "../types";
import { makeId, useLocalStorage } from "../hooks/useLocalStorage";

// 制作中リンク（Figma / GitHub / メモ / 参考URL）を登録・編集するカード。
const DEFAULT_LINKS: LinkItem[] = [
  { id: makeId(), label: "Figma", url: "" },
  { id: makeId(), label: "GitHub", url: "" },
  { id: makeId(), label: "Claudeメモ", url: "" },
  { id: makeId(), label: "Obsidianメモ", url: "" },
  { id: makeId(), label: "参考URL", url: "" },
];

// URL状態：空 / 有効(http/https) / 不正っぽい / メモ文
type UrlKind = "empty" | "valid" | "invalid" | "memo";
function urlKind(s: string): UrlKind {
  const t = s.trim();
  if (!t) return "empty";
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      if (u.protocol === "http:" || u.protocol === "https:") return "valid";
      return "invalid";
    } catch {
      return "invalid";
    }
  }
  // スキーム無しのドメインっぽい／他スキーム → 形式エラーとして案内
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t) || /^[\w.-]+\.[a-z]{2,}([\/:].*)?$/i.test(t)) {
    return "invalid";
  }
  return "memo";
}

export default function LinksCard() {
  const [links, setLinks] = useLocalStorage<LinkItem[]>("shizuku.links", DEFAULT_LINKS);
  const [newLabel, setNewLabel] = useState("");

  const update = (id: string, patch: Partial<LinkItem>) =>
    setLinks(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const remove = (id: string) => {
    const target = links.find((l) => l.id === id);
    if (!window.confirm(`「${target?.label || "このリンク"}」を削除しますか？`)) return;
    setLinks(links.filter((l) => l.id !== id));
  };

  const add = () => {
    const label = newLabel.trim() || "新しいリンク";
    setLinks([...links, { id: makeId(), label, url: "" }]);
    setNewLabel("");
  };

  return (
    <Card eyebrow="Links" title="制作中リンク" defaultOpen={false}>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.id} className="rounded-2xl bg-main-50 px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <input
                value={link.label}
                onChange={(e) => update(link.id, { label: e.target.value })}
                className="grow bg-transparent text-xs font-semibold text-accent-600 outline-none"
              />
              <div className="flex shrink-0 items-center gap-2">
                {urlKind(link.url) === "valid" && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-accent-500 underline-offset-2 hover:underline"
                  >
                    開く
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => remove(link.id)}
                  aria-label={`${link.label || "リンク"} を削除`}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-neutral2-500 transition-colors hover:bg-main-100 hover:text-accent-600"
                >
                  ×
                </button>
              </div>
            </div>
            <input
              value={link.url}
              onChange={(e) => update(link.id, { url: e.target.value })}
              placeholder="URL またはメモを入力…"
              aria-invalid={urlKind(link.url) === "invalid"}
              className={`w-full rounded-xl border bg-white px-3 py-1.5 text-sm outline-none focus:border-accent-300 ${
                urlKind(link.url) === "invalid" ? "border-accent-400" : "border-main-200"
              }`}
            />
            {urlKind(link.url) === "invalid" && (
              <p className="mt-1 text-[11px] leading-relaxed text-accent-600" role="alert">
                URL形式が正しくありません。https:// から始まるURLか、メモ文として入力してください。
              </p>
            )}
            {urlKind(link.url) === "valid" && (
              <p className="mt-1 text-[11px] text-neutral2-500">外部リンクとして開けます。</p>
            )}
          </li>
        ))}
      </ul>

      {links.length === 0 && (
        <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs leading-relaxed text-neutral2-500">
          まだ制作リンクがありません。
          <br />
          Figma・GitHub・ClaudeメモのURLを追加すると、次回ここから再開できます。
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="ラベル名（例: 参考サイト）"
          className="min-w-0 grow rounded-xl border border-main-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-300"
        />
        <button
          onClick={add}
          className="min-h-[44px] shrink-0 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
        >
          追加
        </button>
      </div>
    </Card>
  );
}
