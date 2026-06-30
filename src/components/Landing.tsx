// Shizuku OS の紹介ページ（Landing）。
// 「何の作品か・なぜ作ったか」を伝え、Dashboard へ導線をつなぐ。
// ルーティングはハッシュ方式（#/dashboard）。CTAは通常の <a href="#/dashboard">。

const CORE = [
  { ic: "🩵", title: "今日の制作候補", desc: "今日いちばん進める1つを決め、見失わない。優先度バッジ付き。" },
  { ic: "🌙", title: "夜タスク3行ログ", desc: "やった／学び／次やる。1日を3行で沈殿させる。" },
  { ic: "🔗", title: "制作中リンク", desc: "Figma・GitHub・メモ・公開URLを置いて、再開を速くする。" },
  { ic: "💎", title: "Quality Gate", desc: "案・制作物を「採用／保留／捨てる」で判定する。" },
];

const GITHUB = "https://github.com/saitoh19990720-art/shizuku-os-dashboard";

export default function Landing() {
  return (
    <div className="mx-auto w-full max-w-[680px] px-5">
      {/* Hero */}
      <section className="pb-12 pt-16">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-500">
          Shizuku OS
        </p>
        <h1 className="font-mincho text-3xl font-semibold leading-snug tracking-wide text-ink">
          AIの速さを、
          <br />
          人間の判断で
          <br />
          仕事品質へ戻す制作OS。
        </h1>
        <p className="mt-4 font-ui text-base font-medium text-accent-600">
          制作候補・夜ログ・制作リンク・Quality Gate を、1画面に。
        </p>
        <p className="mt-3 max-w-[540px] text-sm text-neutral2-300">
          AI案をそのまま通さず、「採用していいか」まで支える個人用ダッシュボード。迷わず戻れて、雑な案を通さない。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#/dashboard"
            className="inline-flex min-h-[48px] items-center rounded-2xl bg-accent-500 px-6 text-sm font-medium text-white transition-colors hover:bg-accent-600"
          >
            Dashboardを見る
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-[48px] items-center rounded-2xl border border-main-300 px-6 text-sm font-medium text-accent-600 transition-colors hover:bg-main-100"
          >
            GitHubを見る
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-neutral2-200 bg-white/60 py-12">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-500">Problem</p>
        <h2 className="mb-3 font-mincho text-xl font-semibold text-ink">
          AIで「案」は増えた。でも難しいのは、その先。
        </h2>
        <p className="text-sm leading-relaxed text-ink">
          案・文章・UI・コードは、AIで大量に出せるようになった。本当に重いのは——
          <strong>どれを採用するか／なぜ使えるか／安全か／次にどう進めるか</strong>。
        </p>
      </section>

      {/* Solution */}
      <section className="py-12">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-500">Solution</p>
        <h2 className="mb-3 font-mincho text-xl font-semibold text-ink">
          制作・記録・再開・判断を、1つの流れに。
        </h2>
        <p className="text-sm text-neutral2-300">
          毎日の制作を「始める」だけでなく「戻ってこられる」ように設計した、静かな仕事机。
        </p>
      </section>

      {/* Core */}
      <section className="border-y border-neutral2-200 bg-white/60 py-12">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-500">Core</p>
        <h2 className="mb-4 font-mincho text-xl font-semibold text-ink">4つのカード</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {CORE.map((c) => (
            <div
              key={c.title}
              className="rounded-card border border-neutral2-200 bg-white/80 p-5 shadow-soft backdrop-blur-sm"
            >
              <h3 className="mb-1.5 font-mincho text-base font-semibold text-ink">
                <span className="mr-1.5">{c.ic}</span>
                {c.title}
              </h3>
              <p className="text-sm text-neutral2-300">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quality Gate */}
      <section className="py-12">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-500">Quality Gate</p>
        <h2 className="mb-4 font-mincho text-xl font-semibold text-ink">AI案を、そのまま通さない。</h2>
        <div className="rounded-card border border-main-200 bg-gradient-to-b from-crystal-300 to-main-100 p-6">
          <p className="text-sm text-neutral2-300">
            4つの視点でAIの案・制作物・改善提案を見て、雑なまま前に進めない。
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {["部下視点", "消費者視点", "勝算", "安全"].map((l) => (
              <span
                key={l}
                className="rounded-full border border-main-300 bg-white px-3.5 py-1.5 text-[13px] text-accent-600"
              >
                {l}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-xl bg-crystal-200 px-4 py-2 text-[13px] text-accent-600">採用</span>
            <span className="rounded-xl bg-main-200 px-4 py-2 text-[13px] text-accent-600">保留</span>
            <span className="rounded-xl bg-neutral2-100 px-4 py-2 text-[13px] text-neutral2-300">捨てる</span>
          </div>
          <p className="mt-4 text-sm text-neutral2-300">
            合言葉：雑案を増やすな。<strong className="text-ink">最終判断は人間。</strong>
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-y border-neutral2-200 bg-white/60 py-14">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-accent-500">
          Philosophy
        </p>
        <p className="mx-auto max-w-[540px] text-center font-mincho text-xl leading-relaxed text-ink">
          AIに全部任せるための道具ではなく、AIを使いながら、自分の判断と美意識を失わないためのOS。
        </p>
      </section>

      {/* CTA */}
      <section className="py-14 text-center">
        <h2 className="mb-3 font-mincho text-xl font-semibold text-ink">動くものを、見てください。</h2>
        <p className="mb-6 text-sm text-neutral2-300">
          ローカル保存（localStorage）・外部送信なしのシンプルな1画面アプリです。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="#/dashboard"
            className="inline-flex min-h-[48px] items-center rounded-2xl bg-accent-500 px-6 text-sm font-medium text-white transition-colors hover:bg-accent-600"
          >
            Dashboardを見る
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-[48px] items-center rounded-2xl border border-main-300 px-6 text-sm font-medium text-accent-600 transition-colors hover:bg-main-100"
          >
            GitHubを見る
          </a>
        </div>
      </section>

      <footer className="pb-12 pt-4 text-center font-ui text-[11px] text-neutral2-300">
        © Shizuku Studio — Shizuku OS
      </footer>
    </div>
  );
}
