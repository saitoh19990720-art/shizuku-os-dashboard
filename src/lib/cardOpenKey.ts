// カード開閉状態の保存キー。v2 の接頭辞は既存データとの互換のため変えない。
export function cardOpenKey(storageTitle: string): string {
  return `shizuku.cardOpen.v2.${storageTitle}`;
}
