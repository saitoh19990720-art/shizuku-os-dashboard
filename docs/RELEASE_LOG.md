# RELEASE_LOG.md｜Shizuku OS Dashboard 公開ログ

> 初回公開の記録。X投稿URLだけ、投稿後にしずくが追記する。
> 事実のみ・盛らない。

---

## v0.1 — 初回公開

- **公開日**：2026-07-01
- **公開URL**：https://shizuku-os-dashboard.vercel.app/
- **GitHub**：https://github.com/saitoh19990720-art/shizuku-os-dashboard
- **X投稿URL**：【投稿後にここへ貼る】
- **添付スクショ**：`shizuku-os-dashboard.png`（Dashboard 4カード全体／予定）

### 今日やったこと
- Dashboard v0.1（今日の制作候補／夜タスク3行ログ／制作中リンク／Quality Gate）を実装
- Landing（作品紹介）＋軽量ハッシュルーティング（`/` ↔ `#/dashboard`）を追加
- ドキュメント整備（PRODUCT_VISION / PORTFOLIO_NOTE / PUBLIC_DESCRIPTION / SELECTED_PUBLIC_COPY / X_POST_DRAFT / NOTE_DRAFT）
- 主要ボタンを44pxタップ領域に調整
- GitHub push＋Vercel本番公開、安全確認（秘密情報なし・依存最小・外部API無し）

### 次に改善すること（最大3つ）
1. Quality Gate の判定履歴を残せるようにする
2. 夜ログ・リンクの空状態メッセージ（戻りやすさ強化）
3. 削除ボタン・チェックボックスのタップ領域を少し拡大

---

## v0.2 — Quality Gate 判定履歴

- **公開日**：2026-07-01
- **変更点**：Quality Gate に判定履歴を追加（保存／新しい順で一覧／削除・localStorage）
- **コミット**：`55b687f`
- **公開**：同URLに再デプロイ済み（https://shizuku-os-dashboard.vercel.app/）
- **意味**：Dashboard が「判断ログを持つ制作OS」になった

### 次に改善すること（最大3つ）
1. Obsidian 向け Markdown 出力（履歴の書き出し）← v0.3最有力
2. 夜ログ・リンクの空状態メッセージ
3. 削除ボタン・チェックボックスのタップ領域を少し拡大

---

## v0.3 — Obsidian 向け Markdown 出力

- **公開日**：2026-07-01
- **変更点**：
  - 履歴を**まとめて** Obsidian 用 Markdown（frontmatter `tags: [ShizukuOS, QualityGate]` 付き）でコピーする「Obsidian用にコピー」ボタン
  - 履歴**1件ごと**の「MD」ボタンで、チェック状態（`- [x]` / `- [ ]`）まで含む詳細Markdownをコピー（`# Quality Gate Log｜案名`＋4観点＋次の一手）
  - コピー成功/失敗のフィードバック（失敗時はprompt表示）
- **意味**：判断ログが Obsidian（記憶の母艦）へ流れる導線ができた（§8）
- **やっていないこと**：Obsidian API連携・ファイル自動保存・n8n連携・外部送信（コピーはローカルのクリップボードのみ）

### 次に改善すること（最大3つ）
1. 夜ログ・リンクの空状態メッセージ
2. 履歴の絞り込み（採用だけ表示 等）
3. 削除/チェックのタップ領域を少し拡大

---

## v0.4 — Quality Gate 履歴の絞り込み

- **公開日**：2026-07-01
- **変更点**：判定履歴を「すべて / 採用 / 保留 / 捨てる」で絞り込むボタンを追加。絞り込み中も削除・Markdownコピーは動作。絞り込み結果0件時の空状態も表示。
- **仕様**：絞り込み状態はlocalStorageに保存しない（更新すると「すべて」に戻る）
- **意味**：判断ログが増えても「採用だけ」等で見返せる＝実用フェーズへ
- **やっていないこと**：検索・日付絞り込み・タグ・外部連携（localStorage内で完結）

### 次に改善すること（最大3つ）
1. 夜ログ・リンクの空状態メッセージ
2. Markdown全件出力（判定つき）
3. 削除/チェックのタップ領域を少し拡大

---

> 次バージョン（v0.5）の記録は、この下に追記していく。
