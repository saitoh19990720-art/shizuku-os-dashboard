// ESLint の設定（フラット設定・ESLint 10 系）。
// 目的は「書き方の好み」を強制することではなく、
// 動かす前に気づける間違い（未使用・危険な依存配列・React の規約違反）を止めること。
// 整形（インデント・引用符）は対象外。既存コードを書き換えないため。
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 生成物・依存は見ない
  { ignores: ["dist", "node_modules", "*.tsbuildinfo"] },

  // 本体（React + TypeScript）
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Vite の高速リロードが効く形（1ファイル1コンポーネント）を保つ。
      // 定数の同居は許可する＝既存の書き方を壊さないため。
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // レンダー中の ref 書き換え（useLocalStorage.ts）。指摘自体は正しいが、
      // 直すと PR #12 のコードに手が入るため、この導入PRでは扱わない。
      // 無視ではなく warn として残し、別PRで解消する。
      "react-hooks/refs": "warn",
    },
  },

  // 設定ファイル（Node 側で動くもの）
  {
    files: ["*.config.js", "*.config.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      // vite.config.ts の `/// <reference types="vitest/config" />` は
      // vitest の型を読ませるために必要な記述。コード側を削らず、設定で許可する。
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
);
