// 保存層（localStorage）のテスト。
// ここは v0.18 の監査で「保存失敗を黙って捨てない」「インポート失敗時に元へ戻す」を
// 入れた場所で、壊れると記録が消える。だから最初にテストで固定する。
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeId, safeSetItem, safeSetRawItem } from "./useLocalStorage";
import { migrateToProjectStorage, scopedKey } from "../lib/projectStorage";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("safeSetItem", () => {
  it("値をJSONにして保存し、true を返す", () => {
    const ok = safeSetItem("test.tasks", [{ id: "1", text: "書く" }]);

    expect(ok).toBe(true);
    expect(localStorage.getItem("test.tasks")).toBe('[{"id":"1","text":"書く"}]');
  });

  it("保存に失敗すると、例外を投げずに false を返す", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(safeSetItem("test.quota", { a: 1 })).toBe(false);
  });

  it("失敗した後でも、保存できる状態に戻れば true を返す", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(safeSetItem("test.retry", { a: 1 })).toBe(false);
    spy.mockRestore();
    expect(safeSetItem("test.retry", { a: 1 })).toBe(true);
  });
});

describe("safeSetRawItem", () => {
  it("文字列をそのまま書き戻す（インポート失敗時の巻き戻し）", () => {
    localStorage.setItem("test.links", '[{"label":"新しい方"}]');

    const ok = safeSetRawItem("test.links", '[{"label":"元の方"}]');

    expect(ok).toBe(true);
    expect(localStorage.getItem("test.links")).toBe('[{"label":"元の方"}]');
  });

  it("null を渡すとキーごと消える（もともと未保存だった状態へ戻す）", () => {
    localStorage.setItem("test.condition", '{"body":"3"}');

    const ok = safeSetRawItem("test.condition", null);

    expect(ok).toBe(true);
    expect(localStorage.getItem("test.condition")).toBeNull();
  });

  it("書き戻しに失敗すると false を返す", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(safeSetRawItem("test.rollback", "[]")).toBe(false);
  });
});

describe("makeId", () => {
  it("呼ぶたびに違うIDを返す", () => {
    const ids = new Set(Array.from({ length: 50 }, () => makeId()));

    expect(ids.size).toBe(50);
  });
});

// プロジェクト単位保存（v2）へ移行したあと、保存先が正しく切り替わるか。
describe("移行後の保存先", () => {
  it("移行前は旧キーへ保存する", () => {
    safeSetItem("shizuku.tasks", [{ id: "1" }]);

    expect(localStorage.getItem("shizuku.tasks")).toBe('[{"id":"1"}]');
    expect(localStorage.getItem(scopedKey("shizuku.tasks"))).toBeNull();
  });

  it("移行後はv2へ保存し、旧キーは移行時点のまま変わらない", () => {
    localStorage.setItem("shizuku.tasks", '[{"id":"old"}]');
    migrateToProjectStorage();

    safeSetItem("shizuku.tasks", [{ id: "new" }]);

    expect(localStorage.getItem(scopedKey("shizuku.tasks"))).toBe('[{"id":"new"}]');
    expect(localStorage.getItem("shizuku.tasks")).toBe('[{"id":"old"}]');
  });

  it("移行対象外のキー（体調メモ）は移行後も旧キーへ保存する", () => {
    localStorage.setItem("shizuku.tasks", "[]");
    migrateToProjectStorage();

    safeSetItem("shizuku.condition", { body: "3" });

    expect(localStorage.getItem("shizuku.condition")).toBe('{"body":"3"}');
    expect(localStorage.getItem(scopedKey("shizuku.condition"))).toBeNull();
  });

  it("巻き戻し（safeSetRawItem）も移行後はv2へ書き戻す", () => {
    localStorage.setItem("shizuku.links", '[{"label":"元"}]');
    migrateToProjectStorage();
    safeSetItem("shizuku.links", [{ label: "新" }]);

    safeSetRawItem("shizuku.links", '[{"label":"元"}]');

    expect(localStorage.getItem(scopedKey("shizuku.links"))).toBe('[{"label":"元"}]');
  });
});
