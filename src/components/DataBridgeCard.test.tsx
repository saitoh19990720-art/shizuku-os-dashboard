import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import DataBridgeCard from "./DataBridgeCard";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => localStorage.clear());

describe("データ入出力のバックアップ案内", () => {
  it("通常時は書き出せない場合を説明し、書き出し失敗時は補足を隠す", () => {
    localStorage.setItem("shizuku.v2.migration", JSON.stringify({ version: 2, projectId: "default" }));
    localStorage.setItem("shizuku.v2.default.tasks", "{broken");
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<DataBridgeCard />));
      act(() => host.querySelector<HTMLButtonElement>("h2 > button")!.click());
      expect(host.textContent).toContain("保存データが壊れている場合は書き出せません");
      const download = Array.from(host.querySelectorAll("button")).find((button) => button.textContent?.includes(".json ダウンロード"));
      expect(download).toBeDefined();
      act(() => download!.click());
      expect(host.querySelector('[role="alert"]')?.textContent).toContain("書き出しできませんでした");
      expect(host.textContent).not.toContain("バックアップは「.json ダウンロード」で作成できます");
      expect(localStorage.getItem("shizuku.v2.default.tasks")).toBe("{broken");
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });
});
