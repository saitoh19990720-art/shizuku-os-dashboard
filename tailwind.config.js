/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // CLAUDE.md §6.1 のデザイントークン（2026-06-10 更新の新パレット）
      colors: {
        main: {
          50: "#F7F8FC",
          100: "#EEF4FF",
          200: "#DCE9FF",
          300: "#C9DBFF",
        },
        accent: {
          300: "#7FA8E8",
          400: "#6E95D8",
          500: "#5A84C9",
          600: "#4A73B8",
        },
        crystal: {
          100: "#DFF7FF",
          200: "#CFEFFF",
          300: "#E6F5FF",
        },
        neutral2: {
          50: "#FAFAFA",
          100: "#F2F2F2",
          200: "#E6E6E6",
          300: "#D9D9D9",
        },
        ink: "#1E2633",
      },
      fontFamily: {
        // 見出し＝明朝（世界観の核） / UI＝丸ゴシック / 本文＝サンセリフ
        mincho: ['"Shippori Mincho"', "serif"],
        ui: ['"Zen Kaku Gothic New"', "sans-serif"],
        body: ['"Noto Sans JP"', "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        // 影は弱く（CLAUDE.md §6.1）
        soft: "0 4px 20px -8px rgba(90, 132, 201, 0.18)",
      },
    },
  },
  plugins: [],
};
