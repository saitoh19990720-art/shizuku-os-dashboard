# Shizuku OS Dashboard v0.1

しずく専用の、制作・夜タスク・リンクを1画面でまとめる仕事用ダッシュボード。
スマホ幅（360px前後）に合わせた、水色×白×薄グレーの静かなUI。

## できること

- **今日の制作候補**：タスクを優先度バッジ（A / B / C）付きで管理。チェックで完了・追加・削除。
- **夜タスク3行ログ**：「やった / 学び / 次やる」を1日分として記録。新しい順に並ぶ。
- **制作中リンク**：Figma / GitHub / Claudeメモ / Obsidianメモ / 参考URL を編集・追加。URLは「開く」リンクに。

入力内容はすべて **localStorage** に自動保存され、ページを更新しても残ります（この端末内だけ・外部送信なし）。

## 技術スタック

- **React** + **TypeScript**（画面と型）
- **Vite**（開発サーバー・ビルド）
- **Tailwind CSS**（配色・レイアウト。デザイントークンは `tailwind.config.js`）
- **localStorage**（保存。外部DB・サーバーなし）

## 必要なもの

- Node.js（18以上を推奨。動作確認は Node 24）

## 起動方法

```bash
npm install   # 1回だけ：必要な部品を入れる
npm run dev   # 開発サーバーを起動
```

起動すると `http://localhost:5173` のようなURLが表示されます。ブラウザで開いてください。

止めるときは、ターミナルで `Ctrl + C`。

## 本番ビルド（任意・公開前の確認用）

```bash
npm run build     # dist/ に書き出す
npm run preview   # 書き出した結果をプレビュー
```

## フォルダ構成

```text
shizuku-os-dashboard/
├─ index.html              入口のHTML（Googleフォント読み込み）
├─ src/
│  ├─ main.tsx             アプリの起点
│  ├─ App.tsx              3カードを並べる画面本体
│  ├─ index.css            背景・全体スタイル
│  ├─ types.ts             データ型（Task / NightLog / LinkItem）
│  ├─ hooks/
│  │  └─ useLocalStorage.ts  保存用フック＋ID生成
│  └─ components/
│     ├─ Card.tsx          カードの共通枠
│     ├─ TaskCard.tsx      今日の制作候補
│     ├─ NightLogCard.tsx  夜タスク3行ログ
│     └─ LinksCard.tsx     制作中リンク
├─ tailwind.config.js      配色・フォントのデザイントークン
└─ package.json
```

## デザインの根拠（CLAUDE.md §6.1 準拠）

- 配色：Main（白〜水色）/ Accent（青）/ Crystal（氷の差し色）/ Neutral（灰）
- フォント：見出し＝Shippori Mincho（明朝）、UI＝Zen Kaku Gothic New、本文＝Noto Sans JP
- 角丸20px・影は弱く・線は薄く・余白広め

## これから（v0.2以降の候補）

- デザイン微調整（Figmaとの細部合わせ）
- GitHub公開 / Vercelデプロイ
- n8n・Obsidian連携（夜ログの自動転記）

※ 今回はここ（ローカルで動く）までが合格ライン。上記はまだやりません。
