// プロジェクト単位の保存（v2）。
// 目的：12カード→6構造化の前提として、保存を projectId で仕切れるようにする。
//
// 安全方針（この順番を崩さない）
//   1. 既定プロジェクトは固定ID
//   2. 旧キー（v1）は削除も上書きもしない＝いつでも戻れる
//   3. v2 へコピー
//   4. コピー後に v2 を読み直して照合する
//   5. 照合できたときだけ「移行済みの印」を作る
//   6. 書き込み失敗・中断・破損のときは v2 を採用せず旧キーへ戻る
//   7. 印が無い／v2 が壊れているときも旧キーを読む
//
// 対象は DataBridge の10キーだけ。
// shizuku.condition（体調＝機微情報）と shizuku.cardOpen.*（開閉状態）は対象外。

/** 既定プロジェクトの固定ID。将来ここが複数になる。 */
export const DEFAULT_PROJECT_ID = "default";

/** 移行済みの印。これが無い間は旧キーを読む。 */
export const MIGRATION_MARKER_KEY = "shizuku.v2.migration";

/** 移行対象（DataBridge の10キー）。ここに condition / cardOpen は入れない。 */
export const MIGRATED_KEYS = [
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
] as const;

export type MigrationStatus = "migrated" | "already" | "failed";

export interface MigrationResult {
  status: MigrationStatus;
  /** v2 へ書けたキーの数（already / failed のときは 0） */
  copied: number;
  /** 失敗した理由（人間向け・失敗時のみ） */
  reason?: string;
}

/** 移行対象のキーか。対象外（condition / cardOpen）はここで false になる。 */
export function isMigratableKey(key: string): boolean {
  return (MIGRATED_KEYS as readonly string[]).includes(key);
}

/** 旧キー → プロジェクト付きのv2キー。例：shizuku.tasks → shizuku.v2.default.tasks */
export function scopedKey(key: string, projectId: string = DEFAULT_PROJECT_ID): string {
  const suffix = key.startsWith("shizuku.") ? key.slice("shizuku.".length) : key;
  return `shizuku.v2.${projectId}.${suffix}`;
}

/** JSONとして読めるか。壊れたv2を見分けるために使う。 */
function isParseable(raw: string | null): boolean {
  if (raw === null) return false;
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 移行済みの印を読む。壊れていれば null（＝未移行として扱う）。 */
export function readMarker(): { version: number; projectId: string } | null {
  const raw = getItem(MIGRATION_MARKER_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Record<string, unknown>;
    if (o.version !== 2 || typeof o.projectId !== "string") return null;
    return { version: 2, projectId: o.projectId };
  } catch {
    return null;
  }
}

/** 移行が完了しているか。 */
export function isMigrated(): boolean {
  return readMarker() !== null;
}

/**
 * 書き込み先のキー。移行後は必ず v2 を返す。
 * （旧キーへ書き戻すことは無い＝v1 は移行時点のまま凍結される）
 */
export function resolveWriteKey(key: string, projectId: string = DEFAULT_PROJECT_ID): string {
  if (!isMigratableKey(key)) return key;
  if (!isMigrated()) return key;
  return scopedKey(key, projectId);
}

/**
 * 読み出し。次の場合は旧キーへ戻る。
 *   - 移行対象外のキー
 *   - 移行の印が無い
 *   - v2 が存在しない
 *   - v2 が壊れていて、旧キーは読める
 */
export function readLogicalRaw(key: string, projectId: string = DEFAULT_PROJECT_ID): string | null {
  if (!isMigratableKey(key) || !isMigrated()) return getItem(key);

  const v2raw = getItem(scopedKey(key, projectId));
  const v1raw = getItem(key);

  if (v2raw === null) return v1raw;
  if (!isParseable(v2raw) && isParseable(v1raw)) return v1raw;
  return v2raw;
}

/**
 * 旧キー → v2 へコピーして移行する。
 * 途中で失敗したら、この実行で書いた v2 だけを消して未移行のまま返す（旧キーは触らない）。
 */
export function migrateToProjectStorage(
  projectId: string = DEFAULT_PROJECT_ID,
): MigrationResult {
  if (isMigrated()) return { status: "already", copied: 0 };

  const written: string[] = [];
  try {
    // 3. コピー（中身が無いキーは作らない）
    for (const key of MIGRATED_KEYS) {
      const raw = getItem(key);
      if (raw === null) continue;
      localStorage.setItem(scopedKey(key, projectId), raw);
      written.push(scopedKey(key, projectId));
    }

    // 4. 読み直して照合（1件でも食い違えば失敗）
    for (const key of MIGRATED_KEYS) {
      const raw = getItem(key);
      if (raw === null) continue;
      if (localStorage.getItem(scopedKey(key, projectId)) !== raw) {
        throw new Error("verify mismatch: " + key);
      }
    }

    // 5. 照合できたときだけ印を作る
    localStorage.setItem(
      MIGRATION_MARKER_KEY,
      JSON.stringify({ version: 2, projectId, migratedAt: new Date().toISOString() }),
    );
    return { status: "migrated", copied: written.length };
  } catch (e) {
    // 6. v2 を採用しない。この実行で書いた分だけ片付ける（旧キーは削除も上書きもしない）
    for (const v2 of written) {
      try {
        localStorage.removeItem(v2);
      } catch {
        // 片付けに失敗しても、印が無いので読み出しは旧キーへ戻る
      }
    }
    return {
      status: "failed",
      copied: 0,
      reason: e instanceof Error ? e.message : "unknown",
    };
  }
}

/** 起動時に一度だけ試す。印があれば何もしない（何度呼んでも安全）。 */
export function ensureMigrated(projectId: string = DEFAULT_PROJECT_ID): MigrationResult {
  return migrateToProjectStorage(projectId);
}
