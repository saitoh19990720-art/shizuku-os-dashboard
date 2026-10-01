// カードの開閉状態と、見出し変更後の保存キー互換のテスト。
// 見出しを変えても、以前保存した開閉状態（shizuku.cardOpen.v2.<旧見出し>）を引き継ぐことを固定する。
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import Card from "./Card";
import { cardOpenKey } from "../lib/cardOpenKey";
import QualityGateCard from "./QualityGateCard";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(ui: React.ReactNode) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(ui));
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  localStorage.clear();
});

function toggleButton(container: HTMLElement) {
  return container.querySelector("h2 > button") as HTMLButtonElement;
}

describe("Card の開閉状態", () => {
  it("旧見出しで閉じて保存していたカードは、新しい見出しでも閉じたまま", () => {
    localStorage.setItem(cardOpenKey("夜タスク3行ログ"), "false");

    const c = render(
      <Card title="夜の振り返り" storageTitle="夜タスク3行ログ">
        <p>中身</p>
      </Card>,
    );

    expect(toggleButton(c).getAttribute("aria-expanded")).toBe("false");
    expect(c.textContent).not.toContain("中身");
    expect(localStorage.getItem(cardOpenKey("夜の振り返り"))).toBeNull();
  });

  it("旧見出しで開いて保存していたカードは、初期値が閉でも開いたまま", () => {
    localStorage.setItem(cardOpenKey("採用していい？を判定"), "true");

    const c = render(
      <Card title="この案を採用する？" storageTitle="採用していい？を判定" defaultOpen={false}>
        <p>中身</p>
      </Card>,
    );

    expect(toggleButton(c).getAttribute("aria-expanded")).toBe("true");
    expect(c.textContent).toContain("中身");
  });

  it("保存がないときだけ、初期値（閉）で始まる", () => {
    const c = render(
      <Card title="この案を採用する？" storageTitle="採用していい？を判定" defaultOpen={false}>
        <p>中身</p>
      </Card>,
    );

    expect(toggleButton(c).getAttribute("aria-expanded")).toBe("false");
  });

  it("開閉すると旧見出しのキーへ保存され、開閉ボタンは中身の領域を指す", () => {
    const c = render(
      <Card title="夜の振り返り" storageTitle="夜タスク3行ログ">
        <p>中身</p>
      </Card>,
    );
    const button = toggleButton(c);

    act(() => button.click());

    expect(localStorage.getItem(cardOpenKey("夜タスク3行ログ"))).toBe("false");
    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).not.toBeNull();
  });

  it("storageTitle を渡さないカードは、従来どおり見出しをキーに使う", () => {
    localStorage.setItem(cardOpenKey("週次の振り返り"), "false");

    const c = render(
      <Card title="週次の振り返り">
        <p>中身</p>
      </Card>,
    );

    expect(toggleButton(c).getAttribute("aria-expanded")).toBe("false");
  });
});

describe("採用判定の表示", () => {
  it("保存値 drop は「見送る」と表示し、保存済みの記録は書き換えない", () => {
    const stored = JSON.stringify([
      { id: "r1", name: "古い案", checks: {}, verdict: "drop", next: "", savedAt: "2026/9/1 10:00" },
    ]);
    localStorage.setItem("shizuku.qualityGateHistory", stored);
    localStorage.setItem(cardOpenKey("採用していい？を判定"), "true");

    const c = render(<QualityGateCard />);

    const item = Array.from(c.querySelectorAll("li")).find((li) => li.textContent?.includes("古い案"));
    expect(item?.textContent).toContain("見送る");
    expect(c.textContent).not.toContain("捨てる");

    // 旧キー（shizuku.qualityGateHistory）とプロジェクト別の新キー（shizuku.v2.<id>.qualityGateHistory）の両方を見る
    const keys = Object.keys(localStorage).filter((k) => k.endsWith("qualityGateHistory"));
    expect(keys.some((k) => k.startsWith("shizuku.v2."))).toBe(true);
    const saved = keys
      .map((k) => JSON.parse(localStorage.getItem(k)!)[0].verdict);
    expect(saved.length).toBeGreaterThan(0);
    expect(saved.every((v) => v === "drop")).toBe(true);
  });
});
