# PORTFOLIO_NOTE.md｜Shizuku OS Dashboard v0.1

> ポートフォリオ／応募で「この作品をどう説明するか」のメモ。
> 公開URLやスクショと一緒に使う。最終更新：2026-07-01

---

## 1. 作品名
**Shizuku OS Dashboard v0.1**

## 2. 一言説明
AIの速さを、人間の判断で仕事品質へ戻す制作OS。

## 3. 背景
AIで案・文章・UI・コードは大量に出せるようになった。
でも本当に重いのは「どれを採用するか／なぜ使えるか／安全か／次にどう進めるか」。
その**判断と再開**を支えるために作った、個人用の制作ダッシュボード。

## 4. 作ったもの
- Landing Page（作品紹介）
- Dashboard（実物・1画面）
- 今日の制作候補（優先度A/B/C・チェック）
- 夜タスク3行ログ（やった／学び／次やる）
- 制作中リンク（Figma・GitHub・メモ・参考URL）
- Quality Gate（採用／保留／捨てる）
- localStorage 保存（外部送信なし）

## 5. 工夫した点
- **設計を正にして実装**：思想（PRODUCT_VISION）→ ルール（CLAUDE.md）→ 実装、の順で進めた
- **AIを編成して作った**：Claude Code に CLAUDE.md を読ませ、ルール準拠で実装
- **非プログラマーでも扱える**：README を起動方法・未実装・安全メモまで整備
- **静かなUI**：8px系の余白・カードUI・44px以上のタップ領域・冷色＋明朝
- **量産SaaS感を避けた**：派手な装飾・全部盛りをしない
- **Quality Gate**：AI案を部下視点／消費者視点／勝算／安全の4観点で見て、採用・保留・捨てるに分ける（＝この作品の核）
- **依存を増やさない**：ルーティングは軽量ハッシュ方式（react-router不使用）

## 6. 技術
React / TypeScript / Tailwind CSS / Vite / localStorage / Vercel

## 7. まだやっていないこと（v0.1）
ログイン／外部API接続／n8n本接続／複数ユーザー対応／通知／課金

## 8. 次に改善するなら
- Quality Gate の判定履歴
- Obsidian 向け Markdown 出力
- 夜ログ・リンクの空状態メッセージ
- n8n 接続の準備
- 週次振り返り

---

## リンク
- 公開URL：https://shizuku-os-dashboard.vercel.app/
- GitHub：https://github.com/saitoh19990720-art/shizuku-os-dashboard

## スクショ（しずくが撮って docs/ に置く）
| ファイル名 | 撮る場所 |
|---|---|
| `shizuku-os-lp.png` | `/`（Landing 全体） |
| `shizuku-os-dashboard.png` | `#/dashboard`（4カード） |
| `shizuku-os-quality-gate.png` | Quality Gate 部分アップ |
| `shizuku-os-mobile.png` | スマホ幅表示（任意） |

## 応募での一言（コピペ用）
> Shizuku OS Dashboard｜AIの速さを人間の判断で仕事品質へ戻す制作OS。制作候補・夜ログ・リンク・Quality Gate を1画面に統合し、AI案を「採用/保留/捨てる」で判定できる個人ツール。React/TS/Tailwind/Vite、設計から公開まで一人で担当。
