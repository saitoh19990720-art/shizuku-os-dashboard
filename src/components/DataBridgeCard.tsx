import { useState } from "react";
import Card from "./Card";

// n8n Bridge / JSON Export：全データをJSONで出し入れ（バックアップ＋将来のn8n受け渡し口）。
// 外部接続はしない・localStorage内のデータだけ・秘密情報は扱わない。
const KEYS = [
  "shizuku.tasks",
  "shizuku.nightLogs",
  "shizuku.links",
  "shizuku.qualityGate",
  "shizuku.qualityGateHistory",
  "shizuku.promptBuilder",
  "shizuku.promptVault",
  "shizuku.weeklyReviews",
];

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
    if (!imp.trim()) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(imp);
    } catch {
      alert("JSONの形式が正しくありません。コピー漏れがないか確認してください。入力内容は消えていません。");
      return;
    }
    const obj = parsed as { data?: Record<string, unknown> } | null;
    const data = obj && typeof obj === "object" && obj.data ? obj.data : (parsed as Record<string, unknown>);
    if (typeof data !== "object" || data === null) {
      alert("読み込めるデータが見つかりません。このアプリでエクスポートしたJSONを貼ってください。");
      return;
    }
    if (!window.confirm("現在の保存データを、貼り付けた内容で【上書き】します。よろしいですか？（元に戻せません）")) {
      return;
    }
    let n = 0;
    for (const k of KEYS) {
      if (k in data && (data as Record<string, unknown>)[k] != null) {
        localStorage.setItem(k, JSON.stringify((data as Record<string, unknown>)[k]));
        n++;
      }
    }
    alert(`${n}件のデータを読み込みました。画面を更新します。`);
    window.location.reload();
  };

  return (
    <Card eyebrow="n8n Bridge" title="データ入出力（JSON）" defaultOpen={false}>
      <p className="mb-3 text-xs text-neutral2-300">
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
          onChange={(e) => setImp(e.target.value)}
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
        <p className="mt-1 text-[11px] text-neutral2-300">
          ※上書き前に確認が出ます。心配なら先に「.json ダウンロード」でバックアップを。
        </p>
      </div>
    </Card>
  );
}
