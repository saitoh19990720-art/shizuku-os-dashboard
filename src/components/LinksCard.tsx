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

// http/https で始まる時だけ「開く」リンクにする（メモ文はテキスト表示）
const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

export default function LinksCard() {
  const [links, setLinks] = useLocalStorage<LinkItem[]>("shizuku.links", DEFAULT_LINKS);
  const [newLabel, setNewLabel] = useState("");

  const update = (id: string, patch: Partial<LinkItem>) =>
    setLinks(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const remove = (id: string) => setLinks(links.filter((l) => l.id !== id));

  const add = () => {
    const label = newLabel.trim() || "新しいリンク";
    setLinks([...links, { id: makeId(), label, url: "" }]);
    setNewLabel("");
  };

  return (
    <Card eyebrow="Links" title="制作中リンク">
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
                {isUrl(link.url) && (
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
                  onClick={() => remove(link.id)}
                  aria-label="削除"
                  className="text-neutral2-300 transition-colors hover:text-accent-500"
                >
                  ×
                </button>
              </div>
            </div>
            <input
              value={link.url}
              onChange={(e) => update(link.id, { url: e.target.value })}
              placeholder="URL またはメモを入力…"
              className="w-full rounded-xl border border-main-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-accent-300"
            />
          </li>
        ))}
      </ul>

      {links.length === 0 && (
        <p className="rounded-xl border border-dashed border-main-300 bg-main-50 px-3 py-3 text-xs leading-relaxed text-neutral2-300">
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
          className="grow rounded-xl border border-main-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-300"
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
