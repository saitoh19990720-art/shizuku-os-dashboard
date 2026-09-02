import { useEffect, useState, useSyncExternalStore } from "react";
import { ensureMigrated, readLogicalRaw, resolveWriteKey } from "../lib/projectStorage";

// 「この端末に保存できなかったキー」を覚えておく小さな置き場。
// 保存に失敗しても画面は止めないが、黙って捨てない（利用者に知らせる）。
let failedKeys: string[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return failedKeys;
}

// 保存に失敗したことを記録する（同じキーは1回だけ）。
function reportStorageFailure(key: string) {
  if (failedKeys.includes(key)) return;
  failedKeys = [...failedKeys, key];
  emit();
}

// 保存し直せたら、失敗の記録を取り消す。
function resolveStorageFailure(key: string) {
  if (!failedKeys.includes(key)) return;
  failedKeys = failedKeys.filter((k) => k !== key);
  emit();
}

// 保存に失敗しているキーの一覧を購読する（表示側で使う）。
export function useStorageFailures(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// localStorage への書き込み。成功したら true、失敗したら false を返し、失敗は記録する。
export function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(resolveWriteKey(key), JSON.stringify(value));
    resolveStorageFailure(key);
    return true;
  } catch {
    // 容量超過・プライベートモード等。画面は止めず、失敗として残す。
    reportStorageFailure(key);
    return false;
  }
}

// 指定したキーがこの端末に保存できている状態かどうかを購読する。
// （保存に失敗していれば false。表示側で「保存しました」を出すかの判定に使う）
export function useStorageOk(key: string): boolean {
  return !useStorageFailures().includes(key);
}

// 文字列のまま書き戻す（インポート失敗時に元の値へ戻すため）。
// raw が null のときはキーごと消す（元々未保存だった状態に戻す）。
export function safeSetRawItem(key: string, raw: string | null): boolean {
  try {
    const target = resolveWriteKey(key);
    if (raw === null) localStorage.removeItem(target);
    else localStorage.setItem(target, raw);
    resolveStorageFailure(key);
    return true;
  } catch {
    reportStorageFailure(key);
    return false;
  }
}

// localStorage と同期する useState。
// key ごとに値を保存し、ページ更新後も内容が残る。
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 印があれば何もしない。無いときだけ v1 → v2 のコピーを試す（失敗しても旧キーを読む）。
  ensureMigrated();

  const [value, setValue] = useState<T>(() => {
    try {
      const saved = readLogicalRaw(key);
      return saved !== null ? (JSON.parse(saved) as T) : initialValue;
    } catch {
      // 壊れたデータが入っていても初期値で復帰する
      return initialValue;
    }
  });

  useEffect(() => {
    safeSetItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

// 簡易な一意IDを作る（ライブラリを増やさないため自前）。
export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
