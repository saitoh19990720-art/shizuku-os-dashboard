import Card from "./Card";
import { useLocalStorage } from "../hooks/useLocalStorage";

// 今日のコンディション：体調に合わせて制作量を軽くするための1カード。
// 体調込みで制作OS化する（§1.1 夜型/2E配慮）。データはこの端末のみ・外部送信なし。
interface Condition {
  energy: "low" | "mid" | "high" | "";
  pain: number; // 0〜5
  mode: string; // 観測 / Figma / Claude / 軽実装
  avoid: string;
  next: string;
  restWhen: string;
}

const EMPTY: Condition = {
  energy: "",
  pain: 0,
  mode: "",
  avoid: "重い実装・長時間検索・新規ツール比較",
  next: "",
  restWhen: "痛み・眠気・集中切れで停止する",
};

const ENERGY: { v: Condition["energy"]; label: string }[] = [
  { v: "low", label: "低" },
  { v: "mid", label: "中" },
  { v: "high", label: "高" },
];
const MODES = ["観測", "Figma", "Claude", "軽実装"];

export default function ConditionCard() {
  const [c, setC] = useLocalStorage<Condition>("shizuku.condition", EMPTY);
  const set = <K extends keyof Condition>(key: K, value: Condition[K]) =>
    setC({ ...c, [key]: value });

  return (
    <Card eyebrow="Condition" title="今日のコンディション">
      <p className="mb-3 text-xs text-neutral2-300">
        体調を無視しない。今日できる分だけ、静かに進める。（この端末だけに保存・外に出しません）
      </p>

      {/* 体力 */}
      <p className="mb-1.5 text-xs font-medium text-accent-500">今日の体力</p>
      <div className="mb-3 flex gap-2">
        {ENERGY.map((e) => (
          <button
            key={e.v}
            onClick={() => set("energy", c.energy === e.v ? "" : e.v)}
            className={`min-h-[40px] flex-1 rounded-xl border text-sm font-medium transition-colors ${
              c.energy === e.v
                ? "border-transparent bg-accent-500 text-white"
                : "border-main-200 bg-white text-ink hover:border-accent-300"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* 痛み */}
      <p className="mb-1.5 text-xs font-medium text-accent-500">痛みレベル（0〜5）</p>
      <div className="mb-3 flex gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => set("pain", n)}
            className={`min-h-[40px] flex-1 rounded-xl border text-sm transition-colors ${
              c.pain === n
                ? "border-transparent bg-accent-400 text-white"
                : "border-main-200 bg-white text-ink hover:border-accent-300"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* 制作モード */}
      <p className="mb-1.5 text-xs font-medium text-accent-500">今日の制作モード</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => set("mode", c.mode === m ? "" : m)}
            className={`min-h-[40px] rounded-xl border px-4 text-sm transition-colors ${
              c.mode === m
                ? "border-transparent bg-accent-500 text-white"
                : "border-main-200 bg-white text-ink hover:border-accent-300"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* テキスト系 */}
      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-medium text-accent-500">今日やらないこと</span>
        <textarea
          value={c.avoid}
          onChange={(e) => set("avoid", e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-medium text-accent-500">次の一手（15〜30分で終わる1つ）</span>
        <input
          value={c.next}
          onChange={(e) => set("next", e.target.value)}
          placeholder="例：Figmaで1カードだけ整える"
          className="w-full rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-accent-500">休憩する条件</span>
        <input
          value={c.restWhen}
          onChange={(e) => set("restWhen", e.target.value)}
          className="w-full rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
        />
      </label>
    </Card>
  );
}
