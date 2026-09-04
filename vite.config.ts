import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vite の設定。React プラグインを有効化するだけのシンプル構成。
// テスト（Vitest）は localStorage を使うため jsdom 環境で動かす。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // テストは実装ファイルの隣に置く（.claude/rules/testing.md §4）。
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
