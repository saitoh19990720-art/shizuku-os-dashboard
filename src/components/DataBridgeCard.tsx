import { useState } from "react";
import Card from "./Card";
import { safeSetItem, safeSetRawItem } from "../hooks/useLocalStorage";

// n8n Bridge / JSON Export：全データをJSONで出し入れ（バックアップ＋将来のn8n受け渡し口）。
// 外部接続はしない・localStorage内のデータだけ・秘密情報は扱わない。
// （体調メモ shizuku.condition は機微情報のため、意図的に対象外）
const KEYS = [
  "shizuku.tasks",
  "shizuku.nightLogs",
  "shizuku.links",
  "shizuku.qualityGate",
  "shizuku.qualityGateHistory",
  "shizuku.promptBuilder",
  "shizuku.promptVault",
  "shizuku.weeklyReviews",
  "shizuku.retire",
  "shizuku.nextAction",
];

// カード名（エラー文で「どのデータが壊れているか」を日本語で出すため）
const KEY_LABEL: Record<string, string> = {
  "shizuku.tasks": "今日の制作候補",
  "shizuku.nightLogs": "夜タスク3行ログ",
  "shizuku.links": "制作中リンク",
  "shizuku.qualityGate": "Quality Gate（入力中）",
  "shizuku.qualityGateHistory": "Quality Gate の判定履歴",
  "shizuku.promptBuilder": "Prompt Builder（入力中）",
  "shizuku.promptVault": "保存したプロンプト",
  "shizuku.weeklyReviews": "Weekly Review",
  "shizuku.retire": "今日はここまででOK",
  "shizuku.nextAction": "今日の次アクション",
};

// ---- 形式チェック（読み込むデータが各カードの型に合っているか） ----
// 方針：必須項目（id など）は厳しく見る。後から増えた項目は「無くてもよい／あるなら型が合うこと」。
// これで古いバックアップ（status が無い等）も読めるまま、壊れたデータだけを弾く。
type Row = Record<string, unknown>;

const isObject = (v: unknown): v is Row =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown) => typeof v === "string";
const optStr = (v: unknown) => v === undefined || typeof v === "string";
const optBool = (v: unknown) => v === undefined || typeof v === "boolean";
const optOneOf = (v: unknown, allowed: string[]) =>
  v === undefined || v === null || (typeof v === "string" && allowed.includes(v));
// 必須：真偽値だけを持つオブジェクト（Quality Gate のチェック状態）。
// 画面側で Object.values(gate.checks) を直接呼ぶため、欠けていると読み込み後に落ちる。
const isBoolMap = (v: unknown) =>
  isObject(v) && Object.values(v).every((x) => typeof x === "boolean");
// 必須：文字列だけの配列（Retire のやめる理由）。
// 画面側で r.reasons.includes() を直接呼ぶため、欠けていると読み込み後に落ちる。
const isStrArray = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

const rows = (check: (row: Row) => boolean) => (value: unknown) =>
  Array.isArray(value) && value.every((row) => isObject(row) && check(row));

const VERDICT_VALUES = ["adopt", "hold", "drop"];

const VALIDATORS: Record<string, (value: unknown) => boolean> = {
  "shizuku.tasks": rows(
    (t) =>
      isStr(t.id) &&
      isStr(t.title) &&
      optBool(t.done) &&
      optOneOf(t.priority, ["A", "B", "C"]) &&
      optOneOf(t.status, ["today", "tomorrow", "hold"]),
  ),
  "shizuku.nightLogs": rows(
    (l) => isStr(l.id) && optStr(l.date) && optStr(l.did) && optStr(l.learned) && optStr(l.next),
  ),
  // url は必須。LinksCard が isUrl(link.url) で .trim() を直接呼ぶため、欠けていると描画時に落ちる。
  "shizuku.links": rows((l) => isStr(l.id) && optStr(l.label) && isStr(l.url)),
  "shizuku.qualityGate": (v) =>
    isObject(v) &&
    optStr(v.name) &&
    isBoolMap(v.checks) &&
    optOneOf(v.verdict, VERDICT_VALUES) &&
    optStr(v.next),
  "shizuku.qualityGateHistory": rows(
    (r) =>
      isStr(r.id) &&
      optStr(r.name) &&
      isBoolMap(r.checks) &&
      optOneOf(r.verdict, VERDICT_VALUES) &&
      optStr(r.next) &&
      optStr(r.savedAt),
  ),
  "shizuku.promptBuilder": (v) =>
    isObject(v) &&
    optStr(v.purpose) &&
    optStr(v.constraints) &&
    optStr(v.format) &&
    optStr(v.priority) &&
    optStr(v.avoid),
  "shizuku.promptVault": rows(
    (s) =>
      isStr(s.id) &&
      optStr(s.name) &&
      optStr(s.targetAI) &&
      optStr(s.body) &&
      optBool(s.favorite) &&
      optStr(s.savedAt),
  ),
  "shizuku.weeklyReviews": rows(
    (r) =>
      isStr(r.id) &&
      optStr(r.week) &&
      optStr(r.did) &&
      optStr(r.learned) &&
      optStr(r.next) &&
      optStr(r.focus) &&
      optStr(r.savedAt),
  ),
  "shizuku.retire": (v) =>
    isObject(v) &&
    optStr(v.did) &&
    optStr(v.stage) &&
    isStrArray(v.reasons) &&
    optStr(v.returnTo) &&
    optStr(v.next),
  "shizuku.nextAction": (v) => isObject(v) && optStr(v.text) && optBool(v.done),
};

function buildExport(): string {
  const data: Record<string, unknown> = {};
  for (const k of KEYS) {
    try {
      const raw = localStorage.getItem(k);
      data[k] = raw ? JSON.parse(raw) : null;
    } catch {
      data[k] = null;
    }
  }
  return JSON.stringify(
    { app: "shizuku-os", version: 1, exportedAt: new Date().toISOString(), data },
    null,
    2,
  );
}

export default function DataBridgeCard() {
  const [out, setOut] = useState("");
  const [imp, setImp] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const doCopy = async () => {
    const json = buildExport();
    setOut(json);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("このJSONを選択してコピーしてください：", json);
    }
  };

  const doDownload = () => {
    const json = buildExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shizuku-os-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = () => {
    setError("");
    if (!imp.trim()) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(imp);
    } catch {
      setError(
        "JSONの形式が正しくありません。コピー漏れがないか確認してください。入力内容は消えていません。",
      );
      return;
    }

    const wrapper = parsed as { data?: unknown } | null;
    const data = isObject(wrapper) && isObject(wrapper.data) ? wrapper.data : parsed;
    if (!isObject(data)) {
      setError(
        "読み込めるデータが見つかりません。このアプリでエクスポートしたJSONを貼ってください。",
      );
      return;
    }

    // 中身のあるキーだけを見る（null は「未保存」として無視する）
    const present = KEYS.filter((key) => key in data && data[key] != null);
    const invalid = present.filter((key) => !VALIDATORS[key](data[key]));

    // 1つでも形式が合わなければ、保存も再読み込みもせずに止める。
    if (invalid.length > 0) {
      const names = invalid.map((key) => KEY_LABEL[key] ?? key).join(" / ");
      setError(
        "次のデータの形式が正しくありません：" +
          names +
          "。保存はしていません（今の内容はそのままです）。このアプリの「.json ダウンロード」で作ったファイルを貼り直してください。",
      );
      return;
    }

    if (present.length === 0) {
      setError("読み込めるデータが見つかりません。各カードのデータが空でないか確認してください。");
      return;
    }

    if (
      !window.confirm(
        "現在の保存データを、貼り付けた内容で【上書き】します。よろしいですか？（元に戻せません）",
      )
    ) {
      return;
    }

    // 途中で失敗しても中途半端な状態を残さないよう、書き込む前に今の値を控えておく。
    // （未保存だったキーは null。戻すときはキーごと消す）
    // 控えが取れないと失敗時に元へ戻せないので、その場合は1件も書かずに中止する。
    const backup = new Map<string, string | null>();
    try {
      for (const k of present) backup.set(k, localStorage.getItem(k));
    } catch {
      setError(
        "読み込みを中止しました。現在の保存内容を読み取れないため、失敗したときに元へ戻せません（まだ1件も書き換えていません）。" +
          "ブラウザのプライベートモードや保存のブロック設定を解除してから、もう一度お試しください。",
      );
      return;
    }

    const written: string[] = [];
    let failedKey: string | null = null;
    for (const k of present) {
      if (safeSetItem(k, data[k])) {
        written.push(k);
      } else {
        failedKey = k;
        break; // 1つでも失敗したら、そこで止める（部分反映を広げない）
      }
    }

    // 失敗したら、書けてしまった分を元へ戻す。成功表示は出さない。
    if (failedKey !== null) {
      const restoreFailed: string[] = [];
      for (const k of written) {
        if (!safeSetRawItem(k, backup.get(k) ?? null)) restoreFailed.push(KEY_LABEL[k] ?? k);
      }

      if (restoreFailed.length > 0) {
        setError(
          "保存に失敗し、さらに元の内容へ戻すことにも失敗しました。次のデータが新しい内容のまま残っている可能性があります：" +
            restoreFailed.join(" / ") +
            "。画面は更新していません。まず「.json ダウンロード」で今の状態を控えてから、ブラウザを開き直してください。",
        );
        return;
      }

      setError(
        "「" +
          (KEY_LABEL[failedKey] ?? failedKey) +
          "」を保存できなかったため、読み込みを中止して元の内容に戻しました（部分的に反映されたものはありません）。" +
          "ブラウザのプライベートモードや保存容量の上限が原因のことがあります。画面は更新していません。",
      );
      return;
    }

    alert(String(written.length) + "件のデータを読み込みました。画面を更新します。");
    window.location.reload();
  };

  return (
    <Card eyebrow="n8n Bridge" title="データ入出力（JSON）" defaultOpen={false}>
      <p className="mb-3 text-xs text-neutral2-500">
        全カードの保存内容をJSONで出し入れ。バックアップ＆将来のn8n連携の受け渡し口（外部送信はしません）。
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={doCopy}
          className="min-h-[44px] rounded-xl bg-accent-500 px-4 text-sm font-medium text-white transition-colors hover:bg-accent-600"
        >
          {copied ? "コピーしました" : "JSONをコピー"}
        </button>
        <button
          onClick={doDownload}
          className="min-h-[44px] rounded-xl border border-main-300 px-4 text-sm text-accent-600 transition-colors hover:bg-main-100"
        >
          .json ダウンロード
        </button>
      </div>

      {out && (
        <textarea
          value={out}
          readOnly
          rows={5}
          className="mt-3 w-full resize-none rounded-xl border border-main-200 bg-main-50 px-3 py-2 font-mono text-[11px] text-ink outline-none"
        />
      )}

      <div className="mt-4 border-t border-neutral2-200 pt-4">
        <p className="mb-2 text-xs font-medium text-accent-500">読み込み（インポート）</p>
        <textarea
          value={imp}
          onChange={(e) => {
            setImp(e.target.value);
            if (error) setError("");
          }}
          rows={3}
          placeholder="エクスポートしたJSONを貼り付け…"
          className="w-full resize-none rounded-xl border border-main-200 bg-white px-3 py-2 font-mono text-[11px] text-ink outline-none focus:border-accent-300"
        />
        <button
          onClick={doImport}
          disabled={!imp.trim()}
          className="mt-2 min-h-[44px] w-full rounded-xl border border-main-300 text-sm text-accent-600 transition-colors hover:bg-main-100 disabled:opacity-40"
        >
          読み込む（現在のデータを上書き）
        </button>
        {error && (
          <p
            role="alert"
            className="mt-2 rounded-xl border border-accent-300 bg-crystal-100 px-3 py-2 text-[11px] leading-relaxed text-ink"
          >
            {error}
          </p>
        )}
        <p className="mt-1 text-[11px] text-neutral2-500">
          ※上書き前に確認が出ます。心配なら先に「.json ダウンロード」でバックアップを。
        </p>
      </div>
    </Card>
  );
}
