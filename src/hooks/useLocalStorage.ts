import { useEffect, useState } from "react";

// localStorage と同期する useState。
// key ごとに値を保存し、ページ更新後も内容が残る。
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? (JSON.parse(saved) as T) : initialValue;
    } catch {
      // 壊れたデータが入っていても初期値で復帰する
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 保存に失敗しても画面は止めない
    }
  }, [key, value]);

  return [value, setValue] as const;
}

// 簡易な一意IDを作る（ライブラリを増やさないため自前）。
export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
