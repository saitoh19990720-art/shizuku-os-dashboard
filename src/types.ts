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
