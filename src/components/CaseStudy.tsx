/// <reference types="vite/client" />
import type { ReactNode } from "react";
import qualityGateEvidence from "../assets/case-study/v1-quality-gate-evidence.png";
import liveQualityGate from "../assets/case-study/live-quality-gate-2026-11-03.jpg";
import "./CaseStudy.css";

// Case Study v1：Figma FCy5RRpXsRhXs44WcoPuZt の紹介＋4ブロック＋参照先（PC 163:699 / 375px 163:1092 / 320px 168:768）。
// 構成は adopted-implementation-2026-10-15/figma-reference.json に準拠。本文は2026-11-06に既存制作記録を根拠に最小更新。
// 旧PC/SP画面素材（v1-pc-evidence / v1-sp-evidence）は表示から外しただけで、ファイルは残している。
// 変更前の2ファイルは adopted-implementation-2026-10-15 の *.before に保存済み。

// Case Studyだけで使う書体。index.htmlの共通フォント読込は変更しない。
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Outfit:wght@600&display=swap";

// 参照先4件（References のラベルとURLの対応）。GitHubは固定commitのまま、mainへ置き換えない。
const REFS = [
  {
    label: "背景・12カードの設計記録  ↗",
    href: "https://github.com/saitoh19990720-art/shizuku-os-dashboard/blob/59bceb3db8cfd8daaed08af5d49d5d68c54b61f7/README.md",
  },
  {
    label: "Quality Gateの実装（4観点・3判定）  ↗",
    href: "https://github.com/saitoh19990720-art/shizuku-os-dashboard/blob/59bceb3db8cfd8daaed08af5d49d5d68c54b61f7/src/components/QualityGateCard.tsx",
  },
  {
    label: "Dashboard本体のアクセシビリティ監査（2026-09-22）  ↗",
    href: "https://github.com/saitoh19990720-art/shizuku-os-dashboard/blob/59bceb3db8cfd8daaed08af5d49d5d68c54b61f7/docs/ACCESSIBILITY_AUDIT.md",
  },
  {
    label: "制作時点のPC/SP画面抜粋（GitHub）  ↗",
    href: "https://github.com/saitoh19990720-art/shizuku-os-dashboard/blob/59bceb3db8cfd8daaed08af5d49d5d68c54b61f7/README.md",
  },
];

// 本文中と参照先末尾の2か所で使う、本体の制作記録（固定commit）
const PORTFOLIO_NOTE_HREF =
  "https://github.com/saitoh19990720-art/shizuku-os-dashboard/blob/59bceb3db8cfd8daaed08af5d49d5d68c54b61f7/docs/PORTFOLIO_NOTE.md";

const QUALITY_GATE_SCREENSHOT_HREF =
  "https://github.com/saitoh19990720-art/shizuku-os-dashboard/blob/59bceb3db8cfd8daaed08af5d49d5d68c54b61f7/docs/images/screenshot-quality-gate.png";

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="cs-block" aria-labelledby={`cs-${id}`}>
      <p className="cs-label">{eyebrow}</p>
      <h2 className="cs-heading" id={`cs-${id}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CaseStudy() {
  return (
    <main className="cs-page">
      <link rel="stylesheet" href={FONT_HREF} />

      <header className="cs-intro">
        <p className="cs-label">SHIZUKU OS DASHBOARD / CASE STUDY v1</p>
        <h1 className="cs-title">AIの案を、人が次の一手へ変える</h1>
        <p className="cs-lead cs-pre">
          {"採用・保留・見送るの判断と、次の行動を残す個人用ダッシュボード。\n12カードの情報設計、実装の分担、確認した範囲をまとめました。"}
        </p>
        <p className="cs-small cs-pre">{"個人制作  /  React・TypeScript・Vite・Tailwind CSS"}</p>
      </header>

      <Section id="challenge" eyebrow="01 / CHALLENGE" title="案が増えても、判断と再開地点が残らない">
        <p className="cs-body">
          {"AIで案や文章を作っても、どれを採用するか、なぜ使えるか、安全か、次に何をするかは人が決める必要がある。目的・判断履歴・次の行動を、一画面で参照できる形に整理した。"}
        </p>
        <p className="cs-evidence">
          {"参照：公開リポジトリの背景説明。利用者調査ではなく、個人制作で整理した課題です。"}
        </p>
      </Section>

      <Section id="decisions" eyebrow="02 / DESIGN DECISIONS" title="判断の観点を揃え、次の一手を残す">
        <p className="cs-body">
          {"Quality Gateは、4観点・各3項目で案を確認し、人が採否と次の一手を残す。チェック数だけで自動採否しない。判断の材料と、採否を選ぶ操作を分けている。"}
        </p>
        <p className="cs-body">
          {"しずくは中核価値とFigmaの情報設計を決め、機能追加は12カードで止めた。制作記録に残るこの判断と同じく、Quality Gateでも採否と次の行動を人が決める。"}
        </p>
        <p className="cs-evidence">
          {"根拠：本体制作記録 §6-4・§7とQualityGateCard.tsx。4観点・手動判定・次の一手の保存は実装ソースで確認。利用効果は未測定。"}
        </p>

        {/* Quality Gate図：ラベル → 画像 → 注記 → 記録済み実画面への参照（Figma 164:1164 / 164:1254 / 168:1142） */}
        <figure className="cs-figure">
          <p className="cs-evidence">{"QUALITY GATE / 4観点 → 人が判定 → 次の一手 → 履歴"}</p>
          <img
            className="cs-figure__img"
            src={qualityGateEvidence}
            width={368}
            height={1179}
            alt="2026-09-30の初期デモをFigmaで再構成したQuality Gate画面（当時の再構成で、現行アプリの撮影ではない）。4つの観点グループのチェック項目、人が手動で選ぶ3つの判定、次の一手の入力と保存、空の判定履歴を示す。"
          />
          <figcaption className="cs-figure__caption">
            <span className="cs-caption">
              {"4観点、手動の採否、次の一手、履歴の位置を示す。操作の成功や利用成果の証拠にはしない。"}
            </span>
            <a className="cs-evidence cs-inline-link" href={QUALITY_GATE_SCREENSHOT_HREF} target="_blank" rel="noreferrer">
              {"記録済み実画面：Quality Gate画像（旧表記・下部は抜粋） ↗"}
            </a>
          </figcaption>
        </figure>

        <p className="cs-evidence">
          {"画面は2026-09-30の初期デモをFigmaで再構成した既存素材。旧表記「部下視点・消費者視点・勝算」「捨てる」を保持。現在の観点名・「見送る」は実装参照で確認。現行アプリの撮影ではなく、判定・入力は空の状態です。"}
        </p>
        <img
          className="cs-live-evidence"
          src={liveQualityGate}
          width={328}
          height={1313}
          alt="公開DashboardのQuality Gate。4観点のチェック項目と、採用・保留・見送る、次の一手、判定履歴を表示。"
        />
        <p className="cs-evidence">
          {"公開DashboardのQuality Gate（2026年11月3日・375px撮影）。判定と入力は空の状態です。"}
        </p>
      </Section>

      <Section id="implementation" eyebrow="03 / IMPLEMENTATION" title="本体で決めたことと、AIに任せたこと">
        <p className="cs-body cs-pre">
          {"しずく：中核価値、Figmaの情報設計、12カードで止める範囲、レビュー指摘の採否。\n本体の制作記録では、Claude Codeが実装、Codexがレビューを担当。個別改修の担当は、記録で確認できる範囲に限って記載しています。"}
        </p>
        <p className="cs-note">
          {"設計判断：AIは案と実装を支援し、採否・方向の最終判断を人が持つ。Quality Gateでは確認項目の数と手動判定を分離する。"}
        </p>
        <p className="cs-evidence">
          <a className="cs-inline-link" href={PORTFOLIO_NOTE_HREF} target="_blank" rel="noreferrer">
            {"本体の担当・判断の制作記録（2026-09-08・§7） ↗"}
          </a>
        </p>
        <p className="cs-note">
          {"ケーススタディの制作は本体とは別に記録しています。Claude Codeが4ブロックを実装し、CodexがFigma照合とローカルQAを担当しました。掲載版の検証範囲は、以下に日付とともに記載しています。"}
        </p>
      </Section>

      <Section id="verification" eyebrow="04 / VERIFICATION" title="確認した範囲と、まだ確かめていない範囲">
        <p className="cs-body cs-pre">
          {"2026-10-16時点の掲載版では、型チェック・対象lint・buildを確認。\n当時の本文36要素の一致、9リンク、横はみ出し・重なりなしを320 / 375 / 768 / 1440pxで確認しました。"}
        </p>
        <p className="cs-note">
          {"4幅で9リンクのTab・Shift+Tab巡回と可視フォーカスを確認。戻るリンクはEnterで遷移し、直接URLと再読込でも見出しを確認しました。"}
        </p>
        <p className="cs-note">
          {"公開Dashboardは2026年11月3日、320 / 375 / 768 / 1440pxの確認した表示状態で横方向のはみ出しがないことを確認しました。Quality Gateは12項目をすべてチェックしても判定が自動選択されず、0項目でも人が保留を選べました。"}
        </p>
        <p className="cs-note">
          {"375pxで判定ボタン間のTab移動とフォーカス表示を1か所確認しました。履歴の保存後の永続化、すべての操作、実機での確認は行っていません。"}
        </p>
        <p className="cs-note">
          {"公開ケーススタディの200%ズームとWindowsナレーターは本人が確認し、問題なしと報告。確認した操作の詳細は未記録です。WCAG 2.2 AA完全監査、利用者数・時間削減率・商用成果は未確認・未測定です。"}
        </p>
        <p className="cs-evidence">
          {"検証ログはローカルに保存。公開リポジトリのDashboard本体監査は2026-09-22の別記録であり、今回の掲載版QAとは区別しています。"}
        </p>
      </Section>

      <footer className="cs-refs">
        <p className="cs-label">SOURCE REFERENCES / 設計・実装・監査の参照先</p>
        <ul className="cs-refs__list">
          {REFS.map((ref) => (
            <li key={ref.label}>
              <a className="cs-ref cs-ref--link cs-pre" href={ref.href} target="_blank" rel="noreferrer">
                {ref.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="cs-small cs-pre">
          {"ローカル採用掲載版の検証は2026-10-16時点、公開Dashboardの確認は2026-11-03時点です。\n確認した範囲と、未確認の範囲を分けて記載しています。"}
        </p>
        {/* Figmaの順序どおり、Publication stateの後に置く */}
        <p>
          <a className="cs-ref cs-ref--link cs-pre" href={PORTFOLIO_NOTE_HREF} target="_blank" rel="noreferrer">
            {"本体の担当・設計判断の制作記録（2026-09-08） ↗"}
          </a>
        </p>
      </footer>

      <nav className="cs-links" aria-label="関連リンク">
        <a href="https://shizuku-os-dashboard.vercel.app/" target="_blank" rel="noreferrer" className="cs-link">Live Product：shizuku-os-dashboard.vercel.app</a>
        <a href="#/" className="cs-link">← Shizuku OSについて戻る</a>
      </nav>
    </main>
  );
}
