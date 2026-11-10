// 紹介ページ（Landing）の構造のテスト。
// 読み上げソフトが「本文へ移動」できるよう、本文のまとまり（main）を1つだけ持つことを保つ。
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Landing from "./Landing";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<Landing />));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("Landing", () => {
  it("本文のまとまり（main）が1つあり、大見出し（h1）がその中にある", () => {
    const mains = host.querySelectorAll("main");
    expect(mains).toHaveLength(1);
    expect(mains[0].querySelector("h1")).not.toBeNull();
  });

  it("フッターは本文のまとまり（main）の外にある", () => {
    const footer = host.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer?.closest("main")).toBeNull();
  });
});
