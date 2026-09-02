// プロジェクト単位保存（v2）への移行テスト。
// ここが壊れると記録が消えるので、「失敗したら旧キーへ戻る」ことを中心に固定する。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PROJECT_ID,
  MIGRATION_MARKER_KEY,
  isMigrated,
  migrateToProjectStorage,
  readLogicalRaw,
  resolveWriteKey,
  scopedKey,
} from "../lib/projectStorage";
import { safeSetItem } from "./useLocalStorage";
import { buildExport } from "../components/DataBridgeCard";

const TASKS = "shizuku.tasks";
const LINKS = "shizuku.links";
const TASKS_V1 = '[{"id":"1","text":"書く"}]';
const LINKS_V1 = '[{"label":"Figma","url":"https://example.com"}]';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("正常移行", () => {
  it("旧キーをv2へコピーし、旧キーは残したまま移行済みになる", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    localStorage.setItem(LINKS, LINKS_V1);

    const result = migrateToProjectStorage();

    expect(result.status).toBe("migrated");
    expect(result.copied).toBe(2);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(TASKS_V1);
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 旧キーは消さない
    expect(isMigrated()).toBe(true);
  });

  it("移行後は書き込み先がv2になり、旧キーは書き換わらない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    safeSetItem(TASKS, [{ id: "2", text: "直す" }]);

    expect(localStorage.getItem(scopedKey(TASKS))).toBe('[{"id":"2","text":"直す"}]');
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 移行時点のまま凍結
  });
});

describe("再実行しても不変", () => {
  it("2回目は already を返し、v2の中身が変わらない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "直す" }]);
    const afterEdit = localStorage.getItem(scopedKey(TASKS));

    const second = migrateToProjectStorage();

    expect(second.status).toBe("already");
    expect(second.copied).toBe(0);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(afterEdit); // 編集を巻き戻さない
  });
});

describe("途中書き込み失敗", () => {
  it("1件でも書けなければ移行せず、書いた分を片付けて旧キーを読む", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    localStorage.setItem(LINKS, LINKS_V1);
    const realSetItem = Storage.prototype.setItem;
    let calls = 0;
    // 2件目の書き込みだけ失敗させる（容量超過の再現）
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      k: string,
      v: string,
    ) {
      calls += 1;
      if (calls === 2) throw new DOMException("QuotaExceededError");
      realSetItem.call(this, k, v);
    });

    const result = migrateToProjectStorage();
    vi.restoreAllMocks();

    expect(result.status).toBe("failed");
    expect(isMigrated()).toBe(false);
    expect(localStorage.getItem(MIGRATION_MARKER_KEY)).toBeNull();
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 旧キーは無傷
    expect(readLogicalRaw(TASKS)).toBe(TASKS_V1); // 読み出しは旧キーへ戻る
  });
});

describe("途中中断からの復旧", () => {
  it("印が無く古いv2が残っていても、やり直すと正しい内容で揃う", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    localStorage.setItem(LINKS, LINKS_V1);
    // 前回の中断で、片方だけ古い内容が残っている状態
    localStorage.setItem(scopedKey(TASKS), '[{"id":"old","text":"中断"}]');

    const result = migrateToProjectStorage();

    expect(result.status).toBe("migrated");
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(TASKS_V1); // 上書きして揃う
    expect(localStorage.getItem(scopedKey(LINKS))).toBe(LINKS_V1);
    expect(isMigrated()).toBe(true);
  });
});

describe("破損v1", () => {
  it("旧キーが壊れていても移行は止まらず、内容をそのまま引き継ぐ", () => {
    localStorage.setItem(TASKS, "{壊れたJSON");

    const result = migrateToProjectStorage();

    expect(result.status).toBe("migrated");
    expect(localStorage.getItem(scopedKey(TASKS))).toBe("{壊れたJSON");
    expect(readLogicalRaw(TASKS)).toBe("{壊れたJSON"); // 勝手に作り変えない
  });
});

describe("破損v2", () => {
  it("移行後にv2が壊れたら、旧キーの内容を読む", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    localStorage.setItem(scopedKey(TASKS), "{壊れたJSON");

    expect(readLogicalRaw(TASKS)).toBe(TASKS_V1);
  });

  it("移行の印が壊れていたら、未移行として旧キーを読む", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "直す" }]);

    localStorage.setItem(MIGRATION_MARKER_KEY, "{壊れた印");

    expect(isMigrated()).toBe(false);
    expect(readLogicalRaw(TASKS)).toBe(TASKS_V1);
  });
});

describe("project間のキー分離", () => {
  it("プロジェクトが違えばキーが分かれ、片方を書いても他方は変わらない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    expect(scopedKey(TASKS, "other")).not.toBe(scopedKey(TASKS, DEFAULT_PROJECT_ID));

    localStorage.setItem(scopedKey(TASKS, "other"), '[{"id":"9","text":"別プロジェクト"}]');

    expect(readLogicalRaw(TASKS, "other")).toBe('[{"id":"9","text":"別プロジェクト"}]');
    expect(readLogicalRaw(TASKS, DEFAULT_PROJECT_ID)).toBe(TASKS_V1);
  });
});

describe("condition は移行対象外", () => {
  it("体調メモとカード開閉は移行されず、旧キーのままになる", () => {
    localStorage.setItem("shizuku.condition", '{"body":"3"}');
    localStorage.setItem("shizuku.cardOpen.今日のコンディション", "false");
    localStorage.setItem(TASKS, TASKS_V1);

    migrateToProjectStorage();

    expect(localStorage.getItem(scopedKey("shizuku.condition"))).toBeNull();
    expect(localStorage.getItem(scopedKey("shizuku.cardOpen.今日のコンディション"))).toBeNull();
    expect(resolveWriteKey("shizuku.condition")).toBe("shizuku.condition");
    expect(readLogicalRaw("shizuku.condition")).toBe('{"body":"3"}');
  });
});

describe("v1 import 互換と DataBridge の入出力", () => {
  it("v1形式で取り込んだ内容は既定プロジェクトへ入り、書き出しも同じ形で戻る", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    // v1形式のJSON（キー名は shizuku.tasks のまま）を取り込む＝DataBridge の import と同じ経路
    safeSetItem(TASKS, [{ id: "imported", text: "取り込み" }]);
    safeSetItem(LINKS, [{ label: "GitHub", url: "https://example.com" }]);

    expect(localStorage.getItem(scopedKey(TASKS))).toBe('[{"id":"imported","text":"取り込み"}]');

    const exported = JSON.parse(buildExport()) as {
      version: number;
      data: Record<string, unknown>;
    };

    expect(exported.version).toBe(1); // 書き出しの形は v1 のまま変えない
    expect(exported.data[TASKS]).toEqual([{ id: "imported", text: "取り込み" }]);
    expect(exported.data[LINKS]).toEqual([{ label: "GitHub", url: "https://example.com" }]);
    expect(exported.data["shizuku.condition"]).toBeUndefined(); // 体調は書き出さない
  });
});
