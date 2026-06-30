// アプリ全体で使うデータ型の定義。

// 優先度バッジ（A=最優先 / B=今日中 / C=後で）
export type Priority = "A" | "B" | "C";

// 今日の制作候補タスク
export interface Task {
  id: string;
  title: string;
  priority: Priority;
  done: boolean;
}

// 夜タスク3行ログ（やった / 学び / 次やる）の1日分
export interface NightLog {
  id: string;
  date: string; // 記録した日付（表示用の文字列）
  did: string; // やった
  learned: string; // 学び
  next: string; // 次やる
}

// 制作中リンク（Figma / GitHub / メモ / 参考URL などを自由に登録）
export interface LinkItem {
  id: string;
  label: string; // 例: Figma / GitHub / Claudeメモ
  url: string; // URL またはメモ本文
}

// Quality Gate の判定（採用 / 保留 / 捨てる）
export type Verdict = "adopt" | "hold" | "drop";

// Quality Gate（AIの案・制作物を採用してよいか判定するカードの状態）
export interface QualityGate {
  name: string; // 案・制作物の名前
  checks: Record<string, boolean>; // 各チェック項目の ON/OFF
  verdict: Verdict | null; // 採用 / 保留 / 捨てる
  next: string; // 次の一手
}

// Quality Gate の判定履歴（過去に保存した判定スナップショット1件）
export interface QualityGateRecord {
  id: string;
  name: string; // 案・制作物の名前
  checks: Record<string, boolean>; // 保存時のチェック状態
  verdict: Verdict; // 履歴は判定確定済みのみ保存
  next: string; // 次の一手
  savedAt: string; // 保存日時（表示用）
}
