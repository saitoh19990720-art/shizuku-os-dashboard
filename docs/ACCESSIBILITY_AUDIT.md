# Accessibility Audit and Fix Log

- 対象: Shizuku OS Dashboard v0.19
- 基準: WCAG 2.2 Level A を中心に監査
- 監査・修正日: 2026-09-22
- 公開URL: https://shizuku-os-dashboard.vercel.app/#/dashboard
- 実装PR: https://github.com/saitoh19990720-art/shizuku-os-dashboard/pull/19
- 修正コミット: `d559b52`
- mainマージコミット: `e7e9c47`
- 本番Deployment: `AxVbdakASEtFbJfA13D7Dydg38Bm`

## Scope

既存のUI、12カード構成、機能、デザイン言語を維持したまま、WCAG 2.2 Level Aの説明を妨げる問題だけを修正した。新機能、依存関係、大規模リファクタリング、配色の全面変更は行っていない。

## Accessibility Fix Log

### Issue 1: 入力欄がplaceholderだけに依存していた

#### Before

制作候補名、案・制作物名、制作リンク、Prompt Builder、JSON入出力などの入力欄に、`label`、`aria-label`、`aria-labelledby`のいずれもない箇所があった。スクリーンリーダーでは入力目的を単独で特定できなかった。

#### Change

既存の表示ラベルと結べる箇所は関連付けを維持し、表示を増やせない入力欄には目的が分かる`aria-label`を追加した。

#### Why

WCAG 1.3.1「情報及び関係性」、3.3.2「ラベル又は説明」、4.1.2「名前・役割・値」に対応するため。

#### After

本番アクセシビリティツリーで、例として「制作候補名」「案・制作物の名前」が入力欄の名前として取得できる。

#### Verification

- 公開DOMで追加したaccessible nameを確認
- placeholderは入力例として維持
- 見た目とレイアウトに変更がないことを確認

### Issue 2: カードタイトルが見出し構造に含まれていなかった

#### Before

カードタイトルは開閉ボタン内の`span`で表現され、見出し一覧にはh1と「まずはこの2つだけ」のh2しか現れなかった。

#### Change

共通`Card`コンポーネントを`h2 > button`構造に変更し、既存の開閉操作と`aria-expanded`を維持した。

#### Why

WCAG 1.3.1「情報及び関係性」に対応し、支援技術から画面構造を把握できるようにするため。

#### After

本番DOMでh1は1件、各カードを含むh2は13件となり、カード単位で見出し移動できる。

#### Verification

- 本番DOMで`h1Count = 1`、`h2Count = 13`を確認
- カード開閉がボタン操作のまま維持されていることを確認
- 見た目の階層とカード順が変わっていないことを確認

### Issue 3: リンク・ボタン名を単独取得すると目的が弱かった

#### Before

「開く」「追加」「保存」や「Today / Log / Gate / More」だけでは、リンクやボタンを単独取得した時に対象が分かりにくかった。

#### Change

表示デザインを維持しつつ、「制作リンクを追加」「プロンプトを保存」「Today：今日の制作候補へ移動」のように対象を含むaccessible nameを追加した。

#### Why

WCAG 2.4.4「リンクの目的」に対応するため。

#### After

本番アクセシビリティツリーで、ナビゲーションと主要操作の目的を名称だけで判別できる。

#### Verification

- 本番DOMで「Today：今日の制作候補へ移動」を確認
- 制作リンクの表示名を含む「開く」「削除」の名称を確認
- 表示上の短いラベルと既存レイアウトが維持されていることを確認

### Issue 4: 一部のタップ対象が小さかった

#### Before

一部の補助操作、状態切替、チェックボックスが約20pxで、スマートフォンで押しにくい箇所があった。

#### Change

デザインの密度を変えない範囲で、対象の最小サイズを24px以上に調整した。

#### Why

Level Aの必須項目ではないが、WCAG 2.5.8「ターゲットのサイズ（最低限）」（AA）を見据え、明らかな操作しづらさを残さないため。

#### After

対象操作は24px以上の領域を持ち、既存のカード幅と余白設計は維持された。

#### Verification

- 320px幅で横スクロールがないことを確認（`clientWidth = 305`、`scrollWidth = 305`）
- Tab移動した57件のフォーカス対象が画面外へ飛ばないことを確認

### Issue 5: URLエラーと入力欄の関係が伝わらなかった

#### Before

制作リンクのURLエラーは文字でも表示されていたが、入力欄からエラー説明への意味的な関連付けがなかった。

#### Change

エラー文へ安定した`id`を付け、該当入力から`aria-describedby`で参照した。`aria-invalid`も維持した。

#### Why

エラーの存在だけでなく、どの入力に対する説明かを支援技術へ伝えるため。

#### After

不正なURLを入力した時、該当欄の無効状態と説明文を関連付けて取得できる。

#### Verification

- ソース上で`aria-invalid`と`aria-describedby`の条件付き付与を確認
- エラー文が色だけでなくテキストでも表示されることを確認

## Keyboard and Focus Verification

- Tabだけで主要操作へ順番に移動できる
- 57件のフォーカス対象を一巡し、キーボードトラップなし
- フォーカス順はDOMと画面上の順序に一致
- 全対象で視認可能なfocus outlineを確認
- 水色UI上でも現在位置を識別できる

## Semantic and Landmark Verification

- `header`、`nav`、`main`、`section`、`footer`を確認
- h1は「しずくの仕事机」の1件
- カードタイトルはh2
- 操作UIはbutton、a、input、textarea、selectを使用
- 装飾アイコンは支援技術から除外
- 完了、状態、優先度、判定は色だけでなく文字でも表現

## Build and QA Results

- `npm run typecheck`: 成功
- `npm run build`: 成功
- `git diff --check`: 成功
- 320pxレスポンシブ確認: 横スクロールなし
- キーボード確認: 57対象、トラップ・画面外フォーカスなし
- Vercel Production: Ready
- 公開DOM: 新しい本番アセット`index-D-kduYLV.js`と主要accessible nameを確認

`npm run lint`は今回の差分ではなく、既存コードのエラーで失敗した。確認時点では`LinksCard.tsx`の不要なエスケープと`SaveToast.tsx`のeffect内setStateがエラーで、ほかに既存warningが3件あった。今回のアクセシビリティ差分による新規lintエラーは確認されていない。

## Remaining

- WCAG Level AAの完全監査は未実施
- 色コントラストは明らかな読みにくさと既存記録を確認した範囲で、全状態・全組み合わせの再計測は未実施
- 実スクリーンリーダーによる音声確認は未実施。今回はブラウザのアクセシビリティツリーで確認
- FigmaのfileKey / nodeIdが今回の作業環境に提示されていないため、デザイン値の再照合は未実施

## Result

監査で見つかったLevel A中心のP0/P1相当項目は、安全な最小差分で修正し、本番反映まで確認した。未確認事項は上記Remainingへ分離しており、Shizuku OS Dashboardを「アクセシビリティ監査・実装・QAを一続きで説明できるケーススタディ」として扱うための修正前後ログが完成した。
