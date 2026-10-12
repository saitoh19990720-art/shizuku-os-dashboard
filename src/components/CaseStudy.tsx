/// <reference types="vite/client" />
import type { CSSProperties, ReactNode } from "react";
import landingSource from "../assets/case-study/landing-source.png";
import qualityGateSource from "../assets/case-study/quality-gate-source.png";
import dashboardSource from "../assets/case-study/dashboard-source.png";
import "./CaseStudy.css";

// ローカルレビュー用の表示構成：Figmaの6節（Hero / Challenge / Quality Gate /
// Information Design / Boundary / Closing）を本文の基準にした移植案。
// 旧Human × AI Workflow、problemMap、QA一覧、outcomes、装飾文はこの案の表示から外している。
// 旧全文は handoff/legacy/CaseStudy.before.tsx に保存済みで、公開・削除の承認ではない。

// Case Studyだけで使う書体。index.htmlの共通フォント読込は変更しない。
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Outfit:wght@600&display=swap";

// 主要3カードの元画面抜粋。比率と画像位置はFigma（PC/モバイル共通）の値。
const dashboardCrops: { alt: string; ratio: string; img: CSSProperties }[] = [
  {
    alt: "制作時点の「今日の制作候補」カード",
    ratio: "282 / 403.094",
    img: { width: "330.59%", height: "842.8%", left: "-115.29%", top: "-178.6%" },
  },
  {
    alt: "制作時点の「夜タスク3行ログ」カード",
    ratio: "282 / 340.059",
    img: { width: "330.59%", height: "999.02%", left: "-115.29%", top: "-380%" },
  },
  {
    alt: "制作時点の「制作中リンク」カード上部",
    ratio: "282 / 381.529",
    img: { width: "330.59%", height: "890.43%", left: "-115.29%", top: "-430.43%" },
  },
];

function Section({ variant, eyebrow, title, children }: { variant: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className={`cs-section cs-section--${variant}`}>
      <p className="cs-eyebrow">{eyebrow}</p>
      <h2 className="cs-title">{title}</h2>
      {children}
    </section>
  );
}

export default function CaseStudy() {
  return (
    <main className="cs-page">
      <link rel="stylesheet" href={FONT_HREF} />

      <section className="cs-section cs-section--hero">
        <span className="cs-hero-mark" aria-hidden="true" />
        <p className="cs-eyebrow">SHIZUKU OS DASHBOARD</p>
        <h1 className="cs-title">AIの案を、人が次の一手へ変える個人制作OS</h1>
        <p className="cs-body">AI出力を「採用 / 保留 / 見送る」で判断し、再開地点と次の行動を残すためのReact製ダッシュボード。</p>
        <figure className="cs-figure">
          <div className="cs-frame cs-frame--landing">
            <img className="cs-frame__img" src={landingSource} alt="制作時点のShizuku OS紹介ページ" />
          </div>
          <figcaption className="cs-caption">制作時点の紹介ページ。現行版とは一部表記が異なります。</figcaption>
        </figure>
      </section>

      <Section variant="challenge" eyebrow="CHALLENGE" title="案を増やすだけで、止まらないために">
        <p className="cs-body">実装・運用・安全性まで含めて今やることを決めるのは人。判断を比較可能な観点と次の行動へ変換した。</p>
      </Section>

      <Section variant="gate" eyebrow="QUALITY GATE" title="人が判断するためのQuality Gate">
        <p className="cs-body">実装・運用、使う人の視点、強み・再利用、安全の4観点を各3項目確認し、結論と次の一手を記録する。</p>
        <figure className="cs-figure">
          <div className="cs-frame cs-frame--gate">
            <img className="cs-frame__img" src={qualityGateSource} alt="制作時点のQuality Gateカード" />
          </div>
          <figcaption className="cs-caption">制作時点のQuality Gate。現行の観点名・判定名は本文の表記に対応します。</figcaption>
        </figure>
      </Section>

      <Section variant="info" eyebrow="INFORMATION DESIGN" title="散らばる制作情報を、再開できる12カードへ">
        <p className="cs-body">目的、次の行動、判断履歴を一画面に整理し、中断時の再開地点を残せるようにした。</p>
        <figure className="cs-figure">
          <div className="cs-frame cs-frame--cards">
            <div className="cs-cards">
              {dashboardCrops.map((crop) => (
                <div key={crop.alt} className="cs-crop" style={{ aspectRatio: crop.ratio }}>
                  <img className="cs-crop__img" src={dashboardSource} alt={crop.alt} style={crop.img} />
                </div>
              ))}
              <div className="cs-overview">
                <img className="cs-overview__img" src={dashboardSource} alt="制作時点の12カード全体像（縮小）" />
              </div>
            </div>
          </div>
          <figcaption className="cs-caption">全12カードのうち主要3カードを抜粋。制作時点の画面です。</figcaption>
        </figure>
      </Section>

      <Section variant="boundary" eyebrow="IMPLEMENTATION & SAFETY" title="人が最終判断し、入力はブラウザ内に保存する">
        <p className="cs-body">React / TypeScript / Vite / Tailwind CSSで実装。端末間同期、外部API連携、ログイン、AIによる自動実行は含めない。</p>
      </Section>

      <Section variant="closing" eyebrow="SUMMARY" title="このケーススタディは、人の判断を安全に支える構造を示す">
        <p className="cs-body">AI案に対する人の判断と、次の行動を記録するための制作OS。</p>
      </Section>

      <nav className="cs-links" aria-label="関連リンク">
        <a href="https://shizuku-os-dashboard.vercel.app/" target="_blank" rel="noreferrer" className="cs-link">Live Product：shizuku-os-dashboard.vercel.app</a>
        <a href="#/" className="cs-link">← Shizuku OSについて戻る</a>
      </nav>
    </main>
  );
}
