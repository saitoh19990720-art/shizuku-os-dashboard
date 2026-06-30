import Card from "./Card";
import type { QualityGate, Verdict } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";

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

const EMPTY: QualityGate = { name: "", checks: {}, verdict: null, next: "" };

// AIが出した案・制作物を「採用していいか」判定するカード。
export default function QualityGateCard() {
  const [gate, setGate] = useLocalStorage<QualityGate>(
    "shizuku.qualityGate",
    EMPTY,
  );

  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  const passed = Object.values(gate.checks).filter(Boolean).length;

  const toggle = (key: string) =>
    setGate({ ...gate, checks: { ...gate.checks, [key]: !gate.checks[key] } });

  const setVerdict = (value: Verdict) =>
    setGate({ ...gate, verdict: gate.verdict === value ? null : value });

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
              className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
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
    </Card>
  );
}
