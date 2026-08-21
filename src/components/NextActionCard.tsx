import Card from "./Card";
import { useLocalStorage } from "../hooks/useLocalStorage";

// 今日の次アクション：迷った時の「これ1つ」を上部に固定表示（1画面1主役・ui-patterns）。
interface NextAction {
  text: string;
  done: boolean;
}

export default function NextActionCard() {
  const [na, setNa] = useLocalStorage<NextAction>("shizuku.nextAction", { text: "", done: false });

  return (
    <Card eyebrow="Next Action" title="今日の次アクション">
      <p className="mb-3 text-xs text-neutral2-300">迷ったら、今日はこれ1つだけ。</p>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={na.done}
          onChange={(e) => setNa({ ...na, done: e.target.checked })}
          aria-label={na.text ? `${na.text} を完了にする` : "今日の次アクションを完了にする"}
          className="h-5 w-5 shrink-0 accent-accent-500"
        />
        <input
          value={na.text}
          onChange={(e) => setNa({ ...na, text: e.target.value })}
          placeholder="今日やる1つを書く…（例：Figmaで1カード整える）"
          className={`grow rounded-xl border border-main-200 bg-white px-3 py-2.5 text-[15px] outline-none focus:border-accent-300 ${
            na.done ? "text-neutral2-300 line-through" : "text-ink"
          }`}
        />
      </div>
    </Card>
  );
}
