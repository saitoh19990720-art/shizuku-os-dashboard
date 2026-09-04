import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SetStateAction } from "react";
import {
  ensureMigrated,
  isMigratableKey,
  subscribeActiveProject,
  tryGetActiveProjectId,
  tryReadLogicalRaw,
  tryResolveWriteKey,
} from "../lib/projectStorage";

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
  // どのプロジェクトへ書くのか判定できないときは書かない。
  // 既定側へ倒して書くと、選択中プロジェクトの内容を潰してしまう。
  const target = tryResolveWriteKey(key);
  if (!target.ok) {
    reportStorageFailure(key);
    return false;
  }
  try {
    localStorage.setItem(target.key, JSON.stringify(value));
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
  const resolved = tryResolveWriteKey(key);
  if (!resolved.ok) {
    reportStorageFailure(key);
    return false;
  }
  try {
    if (raw === null) localStorage.removeItem(resolved.key);
    else localStorage.setItem(resolved.key, raw);
    resolveStorageFailure(key);
    return true;
  } catch {
    reportStorageFailure(key);
    return false;
  }
}

export type LoadedState<T> = {
  value: T;
  loaded: boolean;
  /** この値が属するプロジェクト。切替後に旧値を新プロジェクトへ書かないための印。 */
  boundProject: string | null;
};

// 保存済みの内容を読み出す。
// loaded:false は「読み取れなかった＝内容が分からない」で、未保存とは別物。
// 分からないまま初期値を書き戻すと、復旧後に本来の内容を潰すため、保存を見送る合図に使う。
export function loadInitialState<T>(
  key: string,
  initialValue: T,
): LoadedState<T> {
  const active = tryGetActiveProjectId();
  const boundProject = active.ok ? active.projectId : null;
  const read = tryReadLogicalRaw(key);
  if (!read.ok) return { value: initialValue, loaded: false, boundProject };
  try {
    return {
      value: read.raw !== null ? (JSON.parse(read.raw) as T) : initialValue,
      loaded: true,
      boundProject,
    };
  } catch {
    // 壊れたデータが入っていても初期値で復帰する
    return { value: initialValue, loaded: true, boundProject };
  }
}

// localStorage と同期する useState。
// key ごとに値を保存し、ページ更新後も内容が残る。
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 印があれば何もしない。無いときだけ v1 → v2 のコピーを試す（失敗しても旧キーを読む）。
  ensureMigrated();

  const initialRef = useRef(initialValue);
  initialRef.current = initialValue;

  const [state, setState] = useState<LoadedState<T>>(() =>
    loadInitialState(key, initialValue),
  );

  const setValue = useCallback((next: SetStateAction<T>) => {
    setState((prev) => ({
      ...prev,
      value: typeof next === "function" ? (next as (prev: T) => T)(prev.value) : next,
    }));
  }, []);

  // 切替後は、画面に残っている旧プロジェクトの値を新プロジェクトへ書かない。
  useEffect(() => {
    return subscribeActiveProject(() => {
      setState(loadInitialState(key, initialRef.current));
    });
  }, [key]);

  useEffect(() => {
    // 読み出せていない間は保存しない。ストレージが復旧しても、
    // 画面に出ている初期値を本来の保存先へ書き戻さないため。
    if (!state.loaded) {
      reportStorageFailure(key);
      return;
    }
    // 切替通知より先に書き込みが走っても、旧プロジェクトの値は新先へ書かない。
    if (isMigratableKey(key) && state.boundProject !== null) {
      const active = tryGetActiveProjectId();
      if (!active.ok || active.projectId !== state.boundProject) {
        setState(loadInitialState(key, initialRef.current));
        return;
      }
    }
    safeSetItem(key, state.value);
  }, [key, state]);

  return [state.value, setValue] as const;
}

// 簡易な一意IDを作る（ライブラリを増やさないため自前）。
export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
