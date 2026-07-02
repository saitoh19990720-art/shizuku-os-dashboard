import Card from "./Card";

// Brand Panel：世界観トークン（配色・フォント・キーワード）を見せる。
// 中身は CLAUDE.md §6.1 / design-system.md の冷色正本トークンと一致。
const PALETTE: { name: string; colors: string[] }[] = [
  { name: "Main", colors: ["#F7F8FC", "#EEF4FF", "#DCE9FF", "#C9DBFF"] },
  { name: "Accent", colors: ["#7FA8E8", "#6E95D8", "#5A84C9", "#4A73B8"] },
  { name: "Crystal", colors: ["#DFF7FF", "#CFEFFF", "#E6F5FF"] },
  { name: "Neutral", colors: ["#FAFAFA", "#F2F2F2", "#E6E6E6", "#D9D9D9"] },
];

const KEYWORDS = ["水色", "白", "氷", "ガラス", "透明感", "静けさ", "構造", "少し中性的"];

export default function BrandPanelCard() {
  return (
    <Card eyebrow="Brand Panel" title="世界観トークン">
      {/* 配色 */}
      <p className="mb-2 text-xs font-medium text-accent-500">配色</p>
      <div className="flex flex-col gap-2.5">
        {PALETTE.map((g) => (
          <div key={g.name}>
            <p className="mb-1 text-[11px] text-neutral2-300">{g.name}</p>
            <div className="flex gap-1.5">
              {g.colors.map((c) => (
                <div key={c} className="flex-1">
                  <div
                    className="h-8 rounded-lg border border-neutral2-200"
                    style={{ backgroundColor: c }}
                  />
                  <p className="mt-0.5 text-center text-[9px] text-neutral2-300">{c}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-6 w-6 shrink-0 rounded-lg" style={{ backgroundColor: "#1E2633" }} />
          <span className="text-[11px] text-neutral2-300">Ink #1E2633（文字色）</span>
        </div>
      </div>

      {/* フォント */}
      <p className="mb-2 mt-4 text-xs font-medium text-accent-500">フォント</p>
      <div className="flex flex-col gap-1.5 rounded-2xl bg-main-50 px-3 py-3">
        <p className="font-mincho text-base text-ink">見出し — Shippori Mincho（明朝）</p>
        <p className="font-ui text-sm text-ink">UI — Zen Kaku Gothic New</p>
        <p className="font-body text-sm text-ink">本文 — Noto Sans JP</p>
      </div>

      {/* キーワード */}
      <p className="mb-2 mt-4 text-xs font-medium text-accent-500">世界観キーワード</p>
      <div className="flex flex-wrap gap-1.5">
        {KEYWORDS.map((k) => (
          <span
            key={k}
            className="rounded-full bg-crystal-200 px-3 py-1 text-[11px] text-accent-600"
          >
            {k}
          </span>
        ))}
      </div>
    </Card>
  );
}
