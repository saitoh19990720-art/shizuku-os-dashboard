import { useStorageFailures } from "../hooks/useLocalStorage";

// 保存に失敗した時だけ出る注意書き。
// localStorage が使えない（プライベートモード・容量超過など）と入力が端末に残らないため、
// 黙って捨てずに知らせる。失敗が解消したら自動で消える。
export default function StorageAlert() {
  const failures = useStorageFailures();
  if (failures.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-2xl border border-accent-300 bg-crystal-100 px-4 py-3 text-xs leading-relaxed text-ink"
    >
      <p className="mb-1 font-medium text-accent-600">
        この端末に保存できていません（{failures.length}件）
      </p>
      <p className="text-ink">
        書いた内容は画面には残っていますが、<strong className="font-medium text-ink">ページを閉じると消えます</strong>。
        ブラウザのプライベートモード、保存容量の上限、保存のブロック設定が原因のことがあります。
        大事な内容は「データ入出力（JSON）」からコピーまたはダウンロードして控えてください。
      </p>
    </div>
  );
}
