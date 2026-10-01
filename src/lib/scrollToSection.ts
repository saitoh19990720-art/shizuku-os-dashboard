// ハッシュルーティング（#/dashboard）を壊さないよう、location.hash は変えずにスクロールする。
// 動きを減らす設定の人には、なめらかスクロールを使わず即座に移動する。
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
