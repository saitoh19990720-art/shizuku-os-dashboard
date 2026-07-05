import { useState } from "react";
import Card from "./Card";
import { useLocalStorage } from "../hooks/useLocalStorage";

// Retire OK：途中で止めても「次に戻れる形」で残すための締めカード（Figma: retire-ok-card 準拠）。
// 沼らず区切るための道具（§0.1 止め時）。データはlocalStorage。
interface Retire {
  did: string;
  stage: string; // 今できている状態（1つ）
  reasons: string[]; // やめる理由（複数）
  returnTo: string;
  next: string;
}

const EMPTY: Retire = { did: "", stage: "", reasons: [], returnTo: "", next: "" };
const STAGES = ["メモだけ", "ラフだけ", "Figmaカードだけ", "実装プロンプトまで", "コード途中まで"];
const REASONS = ["体力切れ", "頭痛", "眠い", "飽きた", "判断疲れ", "今日はここまでで十分"];

export default function RetireCard() {
  const [r, setR] = useLocalStorage<Retire>("shizuku.retire", EMPTY);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Retire>(key: K, value: Retire[K]) => {
    setR({ ...r, [key]: value });
    setSaved(false);
  };
  const toggleReason = (x: string) =>
    set("reasons", r.reasons.includes(x) ? r.reasons.filter((v) => v !== x) : [...r.reasons, x]);

  const row = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-xl border px-3 text-left text-sm transition-colors ${
        active ? "border-transparent bg-main-100 text-ink" : "border-main-200 bg-white text-ink hover:border-accent-300"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
          active ? "border-accent-500 bg-accent-500" : "border-neutral2-200 bg-white"
        }`}
      />
      {label}
    </button>
  );

  return (
    <Card eyebrow="Retire OK" title="今日はここまででOK" defaultOpen={false}>
      <p className="mb-4 text-xs text-neutral2-300">途中で止めても、次に戻れる形で残す。</p>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-medium text-accent-500">今日やったこと</span>
        <textarea
          value={r.did}
          onChange={(e) => set("did", e.target.value)}
          rows={2}
          placeholder="ここに書く…"
          className="w-full resize-none rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
        />
      </label>

      <p className="mb-1.5 text-xs font-medium text-accent-500">今できている状態</p>
      <div className="mb-4 flex flex-col gap-1.5">
        {STAGES.map((s) => row(s, r.stage === s, () => set("stage", r.stage === s ? "" : s)))}
      </div>

      <p className="mb-1.5 text-xs font-medium text-accent-500">やめる理由</p>
      <div className="mb-4 flex flex-col gap-1.5">
        {REASONS.map((x) => row(x, r.reasons.includes(x), () => toggleReason(x)))}
      </div>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-medium text-accent-500">次に戻る場所</span>
        <input
          value={r.returnTo}
          onChange={(e) => set("returnTo", e.target.value)}
          placeholder="ファイルのここから再開する…"
          className="w-full rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
        />
      </label>

      <label className="mb-5 block">
        <span className="mb-1.5 block text-xs font-medium text-accent-500">次の一手</span>
        <input
          value={r.next}
          onChange={(e) => set("next", e.target.value)}
          placeholder="まずはこれをする…"
          className="w-full rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent-300"
        />
      </label>

      <button
        onClick={() => setSaved(true)}
        className="min-h-[48px] w-full rounded-xl bg-accent-500 text-sm font-medium text-white transition-colors hover:bg-accent-600"
      >
        {saved ? "保存しました 🌙 おつかれさま" : "保存して終了する"}
      </button>
      <p className="mt-2 text-center text-[11px] text-neutral2-300">
        入力はこの端末に保存済み。次回この続きから戻れます。
      </p>
    </Card>
  );
}
