// 保存通知（SaveToast）の表示タイミングのテスト。
// lint 修正で書き方を変えても「保存直後に点灯 → 1.6秒後に最終保存時刻へ戻る」を保つ。
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import SaveToast from "./SaveToast";
import { safeSetItem } from "../hooks/useLocalStorage";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<SaveToast />));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  localStorage.clear();
});

describe("SaveToast", () => {
  it("保存すると「保存しました」が出て、1.6秒後に最終保存時刻の表示へ戻る", () => {
    act(() => {
      safeSetItem("shizuku.test.toast", 1);
    });
    expect(host.textContent).toContain("保存しました");

    act(() => {
      vi.advanceTimersByTime(1599);
    });
    expect(host.textContent).toContain("保存しました");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(host.textContent).toContain("最終保存");
  });

  it("続けて保存すると、もう一度「保存しました」が出る", () => {
    act(() => {
      safeSetItem("shizuku.test.toast", 1);
    });
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(host.textContent).toContain("最終保存");

    act(() => {
      vi.advanceTimersByTime(1000);
      safeSetItem("shizuku.test.toast", 2);
    });
    expect(host.textContent).toContain("保存しました");
  });

  it("開閉状態の保存では通知を出さない", () => {
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    const before = host.textContent;
    act(() => {
      safeSetItem("shizuku.cardOpen.v2.テスト", true);
    });
    expect(host.textContent).toBe(before);
  });
});
