/// <reference types="vite/client" />
import type { ReactNode } from "react";
import qualityGateEvidence from "../assets/case-study/v1-quality-gate-evidence.png";
import liveQualityGate from "../assets/case-study/live-quality-gate-2026-11-03.jpg";
import "./CaseStudy.css";

// 2026-11-07採用原稿の6節を反映。既存Figma由来のスタイル・画像・参照先は維持。
// 本文の正本：outputs/dashboard-case-study-review-2026-11-07/case-study-final.txt。
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
    // 1件目と同じREADME（固定commit）。画像が並ぶ「スクリーンショット」の見出しへ直接移動する。
    href: "https://github.com/saitoh19990720-art/shizuku-os-dashboard/blob/59bceb3db8cfd8daaed08af5d49d5d68c54b61f7/README.md#スクリーンショット",
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
        <p className="cs-label">SHIZUKU OS DASHBOARD / CASE STUDY</p>
        <h1 className="cs-title">Shizuku OS Dashboard</h1>
        <p className="cs-lead">AIの案を、人が判断し、次の一手へつなげる個人用ダッシュボード</p>
        <p className="cs-small">React / TypeScript / Tailwind CSS / Vite</p>
      </header>

      <Section id="overview" eyebrow="01" title="Overview">
        <p className="cs-body">
          {"制作候補、振り返り、関連リンク、案の採否を12カードに整理したWebアプリケーションです。今日取り組むことを決め、判断と次の行動を残して、制作を再開しやすくすることを目的に設計・開発しました。"}
        </p>
      </Section>

      <Section id="problem" eyebrow="02" title="Problem">
        <p className="cs-body">
          {"AIで案や文章を増やせても、どれを採用するか、安全に使えるか、次に何をするかは人が判断する必要があります。制作情報や判断の経緯が散らばると、再開時に探し直す負担も生まれます。個人制作で整理したこれらの課題を、設計の出発点にしました。"}
        </p>
      </Section>

      <Section id="solution" eyebrow="03" title="Solution">
        <p className="cs-body">
          {"「今日の制作候補」「夜の振り返り」「制作中リンク」「Quality Gate」を中心に、12カードを縦に配置しました。カードの折りたたみと「今日・夜ログ・採用判定・道具」のナビゲーションで、必要な場所へ移動できます。"}
        </p>
        <p className="cs-body">
          {"Quality Gateでは「実装・運用」「使う人の視点」「強み・再利用」「安全」の4観点・12項目を確認し、人が「採用・保留・見送る」と次の一手を決めます。チェック数だけでは採否を自動選択しない構成です。"}
        </p>

        <p className="cs-evidence">{"QUALITY GATE / 4観点 → 人が判定 → 次の一手 → 履歴"}</p>
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

      <Section id="implementation" eyebrow="04" title="Design &amp; Development">
        <p className="cs-body">
          {"水色・白・薄いグレーを基調に、PCでもスマートフォンでも1カラムで読む構成にしました。React・TypeScript・Tailwind CSS・Viteで実装し、データ保存にはlocalStorageを使用しています。端末間の同期はありません。"}
        </p>
        <p className="cs-body">
          {"制作記録では、しずくが中核価値、Figmaの情報設計、12カードで止める範囲、レビュー指摘の採否を担当し、Claude Codeが実装、Codexがレビューを担当しました。"}
        </p>
      </Section>

      <Section id="verification" eyebrow="05" title="Validation">
        <p className="cs-body">
          {"2026年11月7日、公開Dashboardをブラウザの1440・390・320px幅で確認し、確認した表示状態では横方向のはみ出しはありませんでした。390px幅では、Quality Gateの12項目をすべてチェックしても採否が自動選択されず、0項目でも人が「保留」を選べることを確認しました。"}
        </p>
        <p className="cs-body">
          {"2026年9月22日のDashboard本体監査記録には、WCAG 2.2レベルAを中心とした入力ラベル・見出し・操作名などの修正と、型チェック・ビルドの成功が残っています。今回の確認は実機試験や全操作の検証、WCAG適合の認定を意味しません。履歴の永続化とFigmaとの再照合は、今回の確認対象に含めていません。"}
        </p>
      </Section>

      <Section id="outcome" eyebrow="06" title="Outcome">
        <p className="cs-body">
          {"12カードのDashboardと、制作背景・設計判断・検証範囲を説明するケーススタディを公開しました。AIの案を人が判断し、次の行動を残すための構成を、動くWebアプリケーションとして示しています。利用者数、作業時間の削減率、商用成果は未測定です。"}
        </p>
      </Section>

      <aside className="cs-archive" aria-label="制作時の資料">
        <p className="cs-evidence">制作時の資料</p>
        <div className="cs-archive__row">
          {/* サムネイルはリンクにしない。原寸への入口は下の文字リンク1本（Figma 228:2949） */}
          <div className="cs-archive__image">
            <img src={qualityGateEvidence} width={368} height={1179} alt="2026-09-30の初期デモをFigmaで再構成したQuality Gate画面（当時の再構成で、現行アプリの撮影ではない）。4つの観点、人が選ぶ判定、次の一手と空の判定履歴。" />
          </div>
          <div className="cs-archive__copy">
            <p className="cs-evidence">{"画面は2026-09-30の初期デモをFigmaで再構成した既存素材。旧表記「部下視点・消費者視点・勝算」「捨てる」を保持。現在の観点名・「見送る」は実装参照で確認。現行アプリの撮影ではなく、判定・入力は空の状態です。"}</p>
            <p className="cs-caption">{"4観点、手動の採否、次の一手、履歴の位置を示す。操作の成功や利用成果の証拠にはしない。"}</p>
            <div className="cs-archive__links">
              <a className="cs-evidence cs-inline-link" href={QUALITY_GATE_SCREENSHOT_HREF} target="_blank" rel="noreferrer">{"記録済み実画面：Quality Gate画像（旧表記・下部は抜粋） ↗"}</a>
              <a className="cs-evidence cs-inline-link" href={qualityGateEvidence} target="_blank" rel="noreferrer">旧再構成画面の原寸資料 ↗</a>
            </div>
          </div>
        </div>
      </aside>

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
          {"本文は2026年11月7日の採用原稿を反映。過去の監査記録と、今回確認した範囲を分けて記載しています。"}
        </p>
        <p>
          <a className="cs-ref cs-ref--link cs-pre" href={PORTFOLIO_NOTE_HREF} target="_blank" rel="noreferrer">
            {"本体の担当・設計判断の制作記録（2026-09-08） ↗"}
          </a>
        </p>
      </footer>

      <nav className="cs-links" aria-label="関連リンク">
        <a href="https://shizuku-os-dashboard.vercel.app/#/dashboard" target="_blank" rel="noreferrer" className="cs-link">Live Product：shizuku-os-dashboard.vercel.app</a>
        <a href="#/" className="cs-link">← Shizuku OSについて戻る</a>
      </nav>
    </main>
  );
}
