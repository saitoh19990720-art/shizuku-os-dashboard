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

/** いま使っているプロジェクトID。印（移行の記録）とは別に持つ。 */
export const ACTIVE_PROJECT_KEY = "shizuku.v2.activeProject";

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

// recovered: 印だけが失われた／壊れた状態からの復旧。既存のv2は一切上書きしない。
// partial: 壊れた旧キーがあり、初回移行を完了させなかった状態（印は作らない＝旧キーで動き続ける）
export type MigrationStatus = "migrated" | "recovered" | "already" | "failed" | "partial";

export interface MigrationResult {
  status: MigrationStatus;
  /** v2 へ書けたキーの数（already / failed のときは 0） */
  copied: number;
  /** JSONとして壊れていたため v2 へ写さなかったキー（旧キーはそのまま残る） */
  skipped: string[];
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
 * いま使っているプロジェクトID。
 * 切替キー →（無ければ）移行時に記録した値 →（無ければ）既定ID の順で決める。
 */
export function getActiveProjectId(): string {
  const explicit = getItem(ACTIVE_PROJECT_KEY);
  if (explicit !== null && explicit !== "") return explicit;
  return readMarker()?.projectId ?? DEFAULT_PROJECT_ID;
}

/**
 * 使うプロジェクトを切り替える（内部API。切替UIはまだ無い）。
 * データは projectId ごとに分かれているので、切り替えても互いに混ざらない。
 * 移行が終わっていないときは切り替えない（旧キーで動いている最中に分岐させないため）。
 */
export function setActiveProject(projectId: string): boolean {
  if (projectId === "" || !isMigrated()) return false;
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    return true;
  } catch {
    return false;
  }
}

/**
 * 書き込み先のキー。移行後は必ず v2 を返す。
 * （旧キーへ書き戻すことは無い＝v1 は移行時点のまま凍結される）
 */
export function resolveWriteKey(key: string, projectId: string = getActiveProjectId()): string {
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
export function readLogicalRaw(key: string, projectId: string = getActiveProjectId()): string | null {
  const read = tryReadLogicalRaw(key, projectId);
  return read.ok ? read.raw : null;
}

/**
 * 読み出しの結果。
 * `ok: false` は「読み取れなかった」で、`ok: true, raw: null`（未保存）とは別物。
 * 取り込み前の控えのように、この2つを取り違えると既存の内容を消しかねない場面で使う。
 */
export type LogicalRead = { ok: true; raw: string | null } | { ok: false };

/** readLogicalRaw と同じ判断をしつつ、読み取れなかった場合を区別して返す。 */
export function tryReadLogicalRaw(
  key: string,
  projectId: string = getActiveProjectId(),
): LogicalRead {
  try {
    const marker = readMarker();
    if (!isMigratableKey(key) || marker === null) {
      return { ok: true, raw: localStorage.getItem(key) };
    }

    const v2raw = localStorage.getItem(scopedKey(key, projectId));

    // 旧キーへ戻れるのは、移行を受けたプロジェクトだけ。
    // それ以外で旧キーを読むと、別プロジェクトの内容が混ざって保存されてしまう。
    if (projectId !== marker.projectId) return { ok: true, raw: v2raw };

    const v1raw = localStorage.getItem(key);

    if (v2raw === null) return { ok: true, raw: v1raw };
    if (!isParseable(v2raw) && isParseable(v1raw)) return { ok: true, raw: v1raw };
    return { ok: true, raw: v2raw };
  } catch {
    return { ok: false };
  }
}

/**
 * 旧キー → v2 へコピーして移行する。
 *
 * 印が無くても、v2 が既にあるなら「移行は済んでいて印だけ失われた」状態。
 * 旧キーは移行時点で凍結されているため、そこで v1 を書くと移行後の編集が消える。
 * そのため復旧モードでは、既存の v2 を一切上書きせず、まだ無いキーだけを補って印を作り直す。
 *
 * 途中で失敗したら、この実行で書いた v2 だけを消して未移行のまま返す（旧キーは触らない）。
 */
export function migrateToProjectStorage(
  projectId: string = DEFAULT_PROJECT_ID,
): MigrationResult {
  if (isMigrated()) return { status: "already", copied: 0, skipped: [] };

  // v2 が1つでも残っていれば復旧モード。初回移行と扱いを分ける。
  const recovering = MIGRATED_KEYS.some((key) => getItem(scopedKey(key, projectId)) !== null);

  const written: { key: string; target: string }[] = [];
  const skipped: string[] = [];
  try {
    // 3. コピー（中身が無いキーは作らない）
    //    既に v2 があるキーは触らない。壊れていても上書きしない
    //    （壊れた v2 は読み出し側が旧キーへ戻るので、消すより残すほうが安全）。
    //    JSONとして壊れている旧キーは v2 へ写さない。写すと壊れたまま新しい正本になってしまう。
    for (const key of MIGRATED_KEYS) {
      const target = scopedKey(key, projectId);
      if (getItem(target) !== null) continue;

      const raw = getItem(key);
      if (raw === null) continue;
      if (!isParseable(raw)) {
        skipped.push(key);
        continue;
      }
      localStorage.setItem(target, raw);
      written.push({ key, target });
    }

    // 4. 読み直して照合（この実行で書いたものだけ。1件でも食い違えば失敗）
    for (const { key, target } of written) {
      if (localStorage.getItem(target) !== getItem(key)) {
        throw new Error("verify mismatch: " + key);
      }
    }

    // 5-a. 初回移行では、壊れた旧キーが1件でもあれば「成功」にしない。
    //      印を作らず、この実行で書いた v2 も残さない＝旧キーのままで動き続ける（復旧可能）。
    //      復旧モードでは中断しない。印を作り直さないと、既存の v2 を読めないままになるため。
    if (skipped.length > 0 && !recovering) {
      for (const { target } of written) {
        try {
          localStorage.removeItem(target);
        } catch {
          // 消せなくても印が無いので、読み出しは旧キーへ戻る
        }
      }
      return { status: "partial", copied: 0, skipped };
    }

    // 5-b. 使用中プロジェクトを先に記録し、印は最後に作る。
    //      印だけ残って「移行済み」に見える中途半端な状態を防ぐ。
    //      ただし既に選択があるなら書き換えない。印の作り直しは「印を戻す」だけの作業で、
    //      利用者が選んでいるプロジェクトを default へ引き戻してよい理由にはならない。
    const activeNow = getItem(ACTIVE_PROJECT_KEY);
    if (activeNow === null || activeNow === "") {
      localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    }
    localStorage.setItem(
      MIGRATION_MARKER_KEY,
      JSON.stringify({ version: 2, projectId, migratedAt: new Date().toISOString() }),
    );
    return {
      status: recovering ? "recovered" : "migrated",
      copied: written.length,
      skipped,
    };
  } catch (e) {
    // 6. v2 を採用しない。この実行で書いた分だけ片付ける（旧キーは削除も上書きもしない）
    for (const { target } of written) {
      try {
        localStorage.removeItem(target);
      } catch {
        // 片付けに失敗しても、印が無いので読み出しは旧キーへ戻る
      }
    }
    // 印を書いた直後に失敗した場合に、印だけ残さない
    try {
      localStorage.removeItem(MIGRATION_MARKER_KEY);
    } catch {
      // 消せない場合でも、下の failed で未移行として扱う
    }
    return {
      status: "failed",
      copied: 0,
      skipped,
      reason: e instanceof Error ? e.message : "unknown",
    };
  }
}

/** 起動時に一度だけ試す。印があれば何もしない（何度呼んでも安全）。 */
export function ensureMigrated(projectId: string = DEFAULT_PROJECT_ID): MigrationResult {
  return migrateToProjectStorage(projectId);
}
