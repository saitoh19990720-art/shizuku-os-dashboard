# Shizuku OS Dashboard v0.1

**AIの速さを、人間の判断で仕事品質へ戻す制作OS。**
制作候補・夜タスクログ・制作リンク・Quality Gate を1画面にまとめる、しずく専用の個人ダッシュボード。スマホ幅（360px前後）に合わせた、水色×白×薄グレーの静かなUI。

🔗 公開URL：https://shizuku-os-dashboard.vercel.app/

---

## 背景

AIで案・文章・UI・コードは大量に出せるようになった。
でも本当に重いのは、**どれを採用するか／なぜ使えるか／安全か／次にどう進めるか**。
Shizuku OS は、その「判断」と「再開」を支えるための小型OS。

> 思想の詳細は [`docs/PRODUCT_VISION.md`](./docs/PRODUCT_VISION.md)。

---

## 主な機能

- **今日の制作候補**：優先度バッジ（A / B / C）付きでタスク管理。チェック・追加・削除。
- **夜タスク3行ログ**：「やった / 学び / 次やる」を1日分として記録。新しい順に並ぶ。
- **制作中リンク**：Figma / GitHub / メモ / 参考URL を編集・追加。URLは「開く」リンクに。
- **Quality Gate**：AI案・制作物を「採用 / 保留 / 捨てる」で判定（部下視点・消費者視点・勝算・安全 × 各3項目＋次の一手）。判定は**履歴に保存**でき、過去の採用/保留/捨てるを見返せる（v0.2）。履歴は**Obsidian用Markdownでコピー**できる（v0.3）。履歴は判定（採用/保留/捨てる）で**絞り込める**（v0.4）。
- **localStorage 保存**：入力はすべてこの端末内に自動保存。外部送信なし。
- **Landing（紹介ページ）**：作品として「何か・なぜ作ったか」を伝える1ページ。

---

## ページ構成

依存を増やさない**軽量ハッシュルーティング**で2画面を切り替えます。

| URL | 内容 |
|---|---|
| `/`（既定） | Landing（Shizuku OS の紹介） |
| `/#/dashboard` | Dashboard（4カードの実物） |

- Landing の「Dashboardを見る」→ Dashboard へ
- Dashboard の「← Aboutに戻る」→ Landing へ

> ハッシュ方式（`#/dashboard`）にしているのは、React Router 等の依存を足さず、サーバー設定（SPA rewrite）も変えずに動かすため。

---

## 技術構成

- **React** + **TypeScript**（画面と型）
- **Vite**（開発サーバー・ビルド）
- **Tailwind CSS**（配色・レイアウト。トークンは `tailwind.config.js`）
- **localStorage**（保存。外部DB・サーバーなし）

---

## 起動方法

```bash
npm install   # 1回だけ：必要な部品を入れる
npm run dev   # 開発サーバーを起動（http://localhost:5173）
```

止めるときはターミナルで `Ctrl + C`。

## 本番ビルド（確認用）

```bash
npm run build
npm run preview
```

---

## 現在やっていないこと（v0.1）

- ログイン / 認証
- 外部API接続
- n8n 本接続
- GitHub 自動連携
- 課金
- 通知
- 複数ユーザー対応

---

## 安全メモ

- データ保存は **localStorage のみ**（この端末内だけ・外部送信なし）
- APIキー・秘密情報は**使っていない**
- 外部サービス連携は**未実装**

---

## 変更履歴
- **v0.4**：Quality Gate 履歴を判定（採用/保留/捨てる）で絞り込む機能を追加。
- **v0.3**：Quality Gate 履歴を Obsidian 向け Markdown（frontmatter付き）でコピーする機能を追加。
- **v0.2**：Quality Gate に判定履歴（保存・一覧・削除、localStorage）を追加。
- **v0.1**：4カード＋Landing＋ハッシュルーティングで初回公開。

## 今後の予定（v0.4 以降の候補）

- 夜ログ・リンクの空状態メッセージ（戻りやすさ強化）
- n8n 接続の準備
- 週次振り返り

> ※ いずれも未実装。実装済み機能と混ぜないこと。
