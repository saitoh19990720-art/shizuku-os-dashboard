import Card from "./Card";

// AI Role Router：タスク種別ごとに「どのAI/ツールに投げるか」を示す早見カード。
// 中身は .claude/rules/model-usage.md と一致（高性能の無駄遣い防止）。
const ROUTES: { task: string; tool: string }[] = [
  { task: "複雑な設計・難所・長時間の自律作業", tool: "Fable 5" },
  { task: "設計・レビュー・通常の実装", tool: "Opus 4.8" },
  { task: "速さ/コスト優先の実装・軽い修正", tool: "Sonnet 4.6" },
  { task: "検索・一次情報・裏取り", tool: "Perplexity" },
  { task: "UI設計・世界観", tool: "Figma" },
  { task: "コード実装", tool: "Claude Code" },
  { task: "レビュー・検品", tool: "Codex" },
  { task: "壁打ち・案出し・画像", tool: "ChatGPT" },
  { task: "記録・知識の沈殿", tool: "Obsidian" },
  { task: "自動化（承認前提）", tool: "n8n" },
];

export default function RoleRouterCard() {
  return (
    <Card eyebrow="AI Role Router" title="どのAIに投げる？">
      <p className="mb-3 text-xs text-neutral2-300">
        迷ったら Opus 4.8。Fable 5 は最難関だけ（料金が高い）。
      </p>
      <ul className="flex flex-col gap-1.5">
        {ROUTES.map((r) => (
          <li
            key={r.task}
            className="flex items-center justify-between gap-3 rounded-2xl bg-main-50 px-3 py-2 text-sm"
          >
            <span className="text-ink">{r.task}</span>
            <span className="shrink-0 rounded-full bg-crystal-200 px-2.5 py-0.5 text-[11px] font-semibold text-accent-600">
              {r.tool}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
