import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import StartHereBanner from "./StartHereBanner";
import { safeSetItem } from "../hooks/useLocalStorage";
import { migrateToProjectStorage, scopedKey, setActiveProject } from "../lib/projectStorage";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root;
let host: HTMLDivElement;
const task = { id: "test-task", title: "確認用", priority: "A", status: "today", done: false };
const log = { id: "test-log", date: "2026-10-02", did: "確認", learned: "保存", next: "次" };

function renderBanner() {
  act(() => root.render(<StrictMode><StartHereBanner /></StrictMode>));
}

beforeEach(() => {
  localStorage.clear();
  migrateToProjectStorage();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("StartHereBanner の保存済みデータの表示", () => {
  it("案内を表示するだけでは保存データを書き換えない", () => {
    const writes = vi.spyOn(Storage.prototype, "setItem");
    renderBanner();
    expect(host.textContent).toContain("はじめに");
    expect(writes).not.toHaveBeenCalled();
  });

  it("候補保存直後に済みになり、夜ログ保存直後に案内が消える", () => {
    renderBanner();
    act(() => { expect(safeSetItem("shizuku.tasks", [task])).toBe(true); });
    expect(host.querySelectorAll("button")[0].textContent).toContain("（済み）");
    act(() => { expect(safeSetItem("shizuku.nightLogs", [log])).toBe(true); });
    expect(host.querySelector("section")).toBeNull();
    expect(localStorage.getItem(scopedKey("shizuku.tasks"))).toBe(JSON.stringify([task]));
    expect(localStorage.getItem(scopedKey("shizuku.nightLogs"))).toBe(JSON.stringify([log]));
  });

  it("完了済みデータを読み直しても案内を再表示しない", () => {
    safeSetItem("shizuku.tasks", [task]);
    safeSetItem("shizuku.nightLogs", [log]);
    renderBanner();
    expect(host.querySelector("section")).toBeNull();
  });

  it("以前あとでを選んだ利用者には表示しない", () => {
    safeSetItem("shizuku.startHere.dismissed", true);
    renderBanner();
    expect(host.querySelector("section")).toBeNull();
  });

  it("保存に失敗した候補を済みとして表示しない", () => {
    renderBanner();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("QuotaExceededError"); });
    act(() => { expect(safeSetItem("shizuku.tasks", [task])).toBe(false); });
    expect(host.textContent).not.toContain("（済み）");
    expect(host.querySelector("section")).not.toBeNull();
  });

  it("プロジェクト切替時に案内を読み直し、旧記録を新しい保存先へ書かない", () => {
    safeSetItem("shizuku.tasks", [task]);
    safeSetItem("shizuku.nightLogs", [log]);
    renderBanner();
    expect(host.querySelector("section")).toBeNull();
    act(() => { expect(setActiveProject("test-second")).toBe(true); });
    expect(host.querySelector("section")).not.toBeNull();
    expect(host.textContent).not.toContain("（済み）");
    expect(localStorage.getItem(scopedKey("shizuku.tasks", "test-second"))).toBeNull();
    expect(localStorage.getItem(scopedKey("shizuku.nightLogs", "test-second"))).toBeNull();
    act(() => { expect(setActiveProject("default")).toBe(true); });
    expect(host.querySelector("section")).toBeNull();
    expect(localStorage.getItem(scopedKey("shizuku.tasks"))).toBe(JSON.stringify([task]));
  });

  it("壊れた保存値を初期値で上書きしない", () => {
    localStorage.setItem(scopedKey("shizuku.tasks"), "not-json");
    renderBanner();
    expect(host.querySelector("section")).not.toBeNull();
    expect(localStorage.getItem(scopedKey("shizuku.tasks"))).toBe("not-json");
  });

  it("読み取りできない間も書き込まず、復旧後に保存済みの完了状態を読める", () => {
    safeSetItem("shizuku.tasks", [task]);
    safeSetItem("shizuku.nightLogs", [log]);
    const reads = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("SecurityError"); });
    const writes = vi.spyOn(Storage.prototype, "setItem");
    renderBanner();
    expect(writes).not.toHaveBeenCalled();
    reads.mockRestore();
    renderBanner();
    expect(host.querySelector("section")).toBeNull();
    expect(localStorage.getItem(scopedKey("shizuku.tasks"))).toBe(JSON.stringify([task]));
  });
});
