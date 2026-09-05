// プロジェクト単位保存（v2）への移行テスト。
// ここが壊れると記録が消えるので、「失敗したら旧キーへ戻る」ことを中心に固定する。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVE_PROJECT_KEY,
  DEFAULT_PROJECT_ID,
  MIGRATION_MARKER_KEY,
  getActiveProjectId,
  isMigrated,
  setActiveProject,
  migrateToProjectStorage,
  readLogicalRaw,
  subscribeActiveProject,
  tryGetActiveProjectId,
  tryReadLogicalRaw,
  tryReadMarker,
  tryResolveWriteKey,
  resolveWriteKey,
  scopedKey,
} from "../lib/projectStorage";
import { loadInitialState, safeSetItem } from "./useLocalStorage";
import { applyImport, buildExport, parseImport } from "../components/DataBridgeCard";

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
  // 「前回の移行が途中で切れた残骸」と「移行後に印だけ失われた」は、残っている情報だけでは
  // 区別できない。区別できない以上、既存のv2は上書きしない側に倒す。
  // 残骸だった場合に残るのは古い写しだけで、正しい内容は凍結された旧キーに残っている。
  it("印が無く古いv2が残っていたら、その値を残したまま足りないキーだけ補う", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    localStorage.setItem(LINKS, LINKS_V1);
    // 前回の中断で、片方だけ古い内容が残っている状態
    const leftover = '[{"id":"old","text":"中断"}]';
    localStorage.setItem(scopedKey(TASKS), leftover);

    const result = migrateToProjectStorage();

    expect(result.status).toBe("recovered");
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(leftover); // 上書きしない
    expect(localStorage.getItem(scopedKey(LINKS))).toBe(LINKS_V1); // 足りない分だけ補う
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 旧キーは無傷で残る
    expect(isMigrated()).toBe(true);
  });
});

describe("破損v1", () => {
  it("壊れた旧キーがあると移行を完了させない（印を作らず旧キーのままにする）", () => {
    localStorage.setItem(TASKS, "{壊れたJSON");
    localStorage.setItem(LINKS, LINKS_V1);

    const result = migrateToProjectStorage();

    expect(result.status).toBe("partial");
    expect(result.copied).toBe(0); // 成功扱いにしない
    expect(result.skipped).toEqual([TASKS]);
    expect(isMigrated()).toBe(false); // 完了markerは立たない
    expect(localStorage.getItem(MIGRATION_MARKER_KEY)).toBeNull();
    expect(localStorage.getItem(scopedKey(TASKS))).toBeNull(); // 壊れた値をv2の正本にしない
    expect(localStorage.getItem(scopedKey(LINKS))).toBeNull(); // 中途半端なv2も残さない
    expect(localStorage.getItem(TASKS)).toBe("{壊れたJSON"); // 旧キーは削除も上書きもしない
    expect(localStorage.getItem(LINKS)).toBe(LINKS_V1);
    expect(readLogicalRaw(TASKS)).toBe("{壊れたJSON"); // 旧キー側で動き続ける
    expect(readLogicalRaw(LINKS)).toBe(LINKS_V1);
  });

  it("壊れた値を直してから実行すると、今度は移行できる（復旧できる）", () => {
    localStorage.setItem(TASKS, "{壊れたJSON");
    localStorage.setItem(LINKS, LINKS_V1);
    expect(migrateToProjectStorage().status).toBe("partial");

    localStorage.setItem(TASKS, TASKS_V1); // 壊れた値を直す

    const retry = migrateToProjectStorage();

    expect(retry.status).toBe("migrated");
    expect(retry.skipped).toEqual([]);
    expect(isMigrated()).toBe(true);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(TASKS_V1);
  });
});

describe("破損v2", () => {
  it("移行後にv2が壊れたら、旧キーの内容を読む", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    localStorage.setItem(scopedKey(TASKS), "{壊れたJSON");

    expect(readLogicalRaw(TASKS)).toBe(TASKS_V1);
  });

  it("印が壊れている間は未移行として扱う（復旧を走らせるまでの状態）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    localStorage.setItem(MIGRATION_MARKER_KEY, "{壊れた印");

    expect(isMigrated()).toBe(false);
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

    const exportResult = buildExport();
    expect(exportResult.ok).toBe(true);
    if (!exportResult.ok) return;
    const exported = JSON.parse(exportResult.json) as {
      version: number;
      data: Record<string, unknown>;
    };

    expect(exported.version).toBe(1); // 書き出しの形は v1 のまま変えない
    expect(exported.data[TASKS]).toEqual([{ id: "imported", text: "取り込み" }]);
    expect(exported.data[LINKS]).toEqual([{ label: "GitHub", url: "https://example.com" }]);
    expect(exported.data["shizuku.condition"]).toBeUndefined(); // 体調は書き出さない
  });
});

describe("projectId 名前空間", () => {
  it("指定したprojectIdのキーへ移行し、default には作らない", () => {
    localStorage.setItem(TASKS, TASKS_V1);

    const result = migrateToProjectStorage("projectA");

    expect(result.status).toBe("migrated");
    expect(localStorage.getItem(scopedKey(TASKS, "projectA"))).toBe(TASKS_V1);
    expect(localStorage.getItem(scopedKey(TASKS, DEFAULT_PROJECT_ID))).toBeNull();
    expect(getActiveProjectId()).toBe("projectA");
  });

  it("移行後の保存先が指定したprojectIdになる（default固定にならない）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage("projectA");

    safeSetItem(TASKS, [{ id: "a", title: "Aの作業" }]);

    expect(resolveWriteKey(TASKS)).toBe(scopedKey(TASKS, "projectA"));
    expect(localStorage.getItem(scopedKey(TASKS, "projectA"))).toBe('[{"id":"a","title":"Aの作業"}]');
    expect(localStorage.getItem(scopedKey(TASKS, DEFAULT_PROJECT_ID))).toBeNull();
  });

  it("setActiveProject で A → B へ切り替えても、データは混ざらない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage("projectA");
    safeSetItem(TASKS, [{ id: "a", title: "Aの作業" }]);

    // 切替は関数経由で行う（UIはまだ無いが、内部APIとして成立している）
    expect(setActiveProject("projectB")).toBe(true);
    expect(getActiveProjectId()).toBe("projectB");

    safeSetItem(TASKS, [{ id: "b", title: "Bの作業" }]);

    expect(localStorage.getItem(scopedKey(TASKS, "projectA"))).toBe('[{"id":"a","title":"Aの作業"}]');
    expect(localStorage.getItem(scopedKey(TASKS, "projectB"))).toBe('[{"id":"b","title":"Bの作業"}]');
    expect(readLogicalRaw(TASKS)).toBe('[{"id":"b","title":"Bの作業"}]'); // いま見えるのはBだけ
  });

  it("Aへ戻すと、Aで書いた内容がそのまま見える", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage("projectA");
    safeSetItem(TASKS, [{ id: "a", title: "Aの作業" }]);
    setActiveProject("projectB");
    safeSetItem(TASKS, [{ id: "b", title: "Bの作業" }]);

    expect(setActiveProject("projectA")).toBe(true);

    expect(readLogicalRaw(TASKS)).toBe('[{"id":"a","title":"Aの作業"}]');
    expect(resolveWriteKey(TASKS)).toBe(scopedKey(TASKS, "projectA"));
  });

  it("未移行のうちは切り替えない（旧キーで動いている最中に分岐させない）", () => {
    localStorage.setItem(TASKS, TASKS_V1);

    expect(setActiveProject("projectB")).toBe(false);
    expect(getActiveProjectId()).toBe(DEFAULT_PROJECT_ID);
  });
});

describe("DataBridge 回帰（export → import の実動経路）", () => {
  const VALID_TASKS = '[{"id":"t1","title":"書く"}]';
  const VALID_LINKS = '[{"id":"l1","label":"Figma","url":"https://example.com"}]';

  it("書き出したJSONをそのまま取り込むと、書き出した時点の内容へ戻る", () => {
    localStorage.setItem(TASKS, VALID_TASKS);
    localStorage.setItem(LINKS, VALID_LINKS);
    migrateToProjectStorage();
    const exportResult = buildExport();
    expect(exportResult.ok).toBe(true);
    if (!exportResult.ok) return;
    const exported = exportResult.json;

    // いったん中身を変えてから、書き出したJSONで戻す
    safeSetItem(TASKS, [{ id: "t2", title: "あとで消す" }]);

    const parsed = parseImport(exported);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const applied = applyImport(parsed.data, parsed.present);

    expect(applied.ok).toBe(true);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(VALID_TASKS);
    expect(localStorage.getItem(scopedKey(LINKS))).toBe(VALID_LINKS);
  });

  it("既存のv1形式JSONを取り込むと、既定プロジェクトへ入る（旧キーは書き換えない）", () => {
    localStorage.setItem(TASKS, "[]");
    migrateToProjectStorage();

    // 旧バージョンが書き出したJSON（data の中は v1 のキー名のまま）
    const v1json = JSON.stringify({
      app: "shizuku-os",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      data: {
        "shizuku.tasks": [{ id: "old1", title: "旧データ" }],
        "shizuku.links": [{ id: "old2", label: "GitHub", url: "https://example.com" }],
      },
    });

    const parsed = parseImport(v1json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const applied = applyImport(parsed.data, parsed.present);

    expect(applied.ok).toBe(true);
    if (applied.ok) expect(applied.written).toBe(2);
    expect(localStorage.getItem(scopedKey(TASKS, DEFAULT_PROJECT_ID))).toBe(
      '[{"id":"old1","title":"旧データ"}]',
    );
    expect(localStorage.getItem(TASKS)).toBe("[]"); // 旧キーは上書きしない
  });

  it("形式が合わないJSONは保存せずに止まる", () => {
    localStorage.setItem(TASKS, VALID_TASKS);
    migrateToProjectStorage();

    // title が無い＝tasks の形式に合わない
    const broken = JSON.stringify({ data: { "shizuku.tasks": [{ id: "x" }] } });
    const parsed = parseImport(broken);

    expect(parsed.ok).toBe(false);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(VALID_TASKS); // 元のまま
  });
});

// 移行が終わった後で印だけが失われる／壊れることがある（別タブでの掃除・拡張機能・容量調整など）。
// このとき旧キーは移行時点で凍結されているため、v1 を v2 へ上書きすると
// 「移行後に書いた内容」だけが消える。ここを固定する。
describe("印の欠落・破損からの復旧（既存v2を守る）", () => {
  it("印が消えても、移行後に編集した内容を古い旧キーで上書きしない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const edited = localStorage.getItem(scopedKey(TASKS));

    localStorage.removeItem(MIGRATION_MARKER_KEY);
    const result = migrateToProjectStorage();

    expect(result.status).toBe("recovered");
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(edited);
    expect(readLogicalRaw(TASKS)).toBe(edited);
    expect(isMigrated()).toBe(true);
  });

  it("印が壊れていても、移行後に編集した内容を古い旧キーで上書きしない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const edited = localStorage.getItem(scopedKey(TASKS));

    localStorage.setItem(MIGRATION_MARKER_KEY, "{壊れた印");
    const result = migrateToProjectStorage();

    expect(result.status).toBe("recovered");
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(edited);
    expect(readLogicalRaw(TASKS)).toBe(edited);
  });

  it("復旧のときは、v2がまだ無いキーだけを旧キーから補う", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const edited = localStorage.getItem(scopedKey(TASKS));
    localStorage.setItem(LINKS, LINKS_V1); // v2側にはまだ無いキー

    localStorage.removeItem(MIGRATION_MARKER_KEY);
    migrateToProjectStorage();

    expect(localStorage.getItem(scopedKey(TASKS))).toBe(edited); // 触らない
    expect(localStorage.getItem(scopedKey(LINKS))).toBe(LINKS_V1); // 補う
  });

  it("復旧のときも旧キーは削除も上書きもされない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);

    localStorage.removeItem(MIGRATION_MARKER_KEY);
    migrateToProjectStorage();

    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1);
  });

  it("壊れた旧キーがあっても、既存の内容を守って印を作り直す", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const edited = localStorage.getItem(scopedKey(TASKS));
    localStorage.setItem(LINKS, "{壊れた旧キー");

    localStorage.removeItem(MIGRATION_MARKER_KEY);
    const result = migrateToProjectStorage();

    expect(result.status).toBe("recovered");
    expect(result.skipped).toEqual([LINKS]);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(edited);
    expect(localStorage.getItem(scopedKey(LINKS))).toBeNull(); // 壊れた値は写さない
    expect(isMigrated()).toBe(true);
  });
});

describe("移行を受けていないプロジェクト", () => {
  it("旧キーの内容を読まない（他プロジェクトのデータが混ざらない）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage(); // 移行を受けたのは default

    expect(readLogicalRaw(TASKS, "another")).toBeNull();
  });
});

describe("印の後始末", () => {
  it("使用中プロジェクトの記録に失敗したら、印も残さない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    const realSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      k: string,
      v: string,
    ) {
      if (k === ACTIVE_PROJECT_KEY) throw new DOMException("QuotaExceededError");
      realSetItem.call(this, k, v);
    });

    const result = migrateToProjectStorage();
    vi.restoreAllMocks();

    expect(result.status).toBe("failed");
    expect(localStorage.getItem(MIGRATION_MARKER_KEY)).toBeNull();
    expect(isMigrated()).toBe(false);
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 旧キーは無傷
  });
});

// 控えが読めないまま書き込むと、失敗したときの巻き戻しが
// 「読めなかった値」を「元々未保存」と取り違えて、既存の内容を消してしまう。
describe("取り込み前の控え（読み取り失敗）", () => {
  it("控えを1件でも読めなければ、1件も書き込まずに中止する", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    localStorage.setItem(LINKS, LINKS_V1);
    migrateToProjectStorage();

    const realGetItem = Storage.prototype.getItem;
    // LINKS の控えだけ読めない状態を作る（保存のブロック設定などの再現）
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === scopedKey(LINKS)) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const result = applyImport(
      { [TASKS]: [{ id: "9", text: "取り込み" }], [LINKS]: [] },
      [TASKS, LINKS],
    );
    vi.restoreAllMocks();

    expect(result.ok).toBe(false);
    // 1件も書いていない（TASKS は元のまま）
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(TASKS_V1);
    expect(localStorage.getItem(scopedKey(LINKS))).toBe(LINKS_V1);
  });

  it("控えが読めなくても、既存の内容は削除されない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === scopedKey(TASKS)) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    applyImport({ [TASKS]: [{ id: "9", text: "取り込み" }] }, [TASKS]);
    vi.restoreAllMocks();

    expect(localStorage.getItem(scopedKey(TASKS))).toBe(TASKS_V1);
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 旧キーも無傷
  });
});

// 印の復旧は「印を作り直す」だけの作業。使用中プロジェクトの選択まで戻してはいけない。
describe("復旧時に選択中プロジェクトを保持する", () => {
  it("印が消えても、選択中のプロジェクトを default へ戻さない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");
    expect(getActiveProjectId()).toBe("B");

    localStorage.removeItem(MIGRATION_MARKER_KEY);
    migrateToProjectStorage();

    expect(localStorage.getItem(ACTIVE_PROJECT_KEY)).toBe("B");
    expect(getActiveProjectId()).toBe("B");
  });

  it("印が壊れても、選択中のプロジェクトを default へ戻さない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");

    localStorage.setItem(MIGRATION_MARKER_KEY, "{壊れた印");
    migrateToProjectStorage();

    expect(getActiveProjectId()).toBe("B");
  });

  it("復旧してもBで書いた内容はBのまま、defaultと混ざらない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");
    safeSetItem(TASKS, [{ id: "b", text: "Bの記録" }]);
    const bValue = localStorage.getItem(scopedKey(TASKS, "B"));

    localStorage.removeItem(MIGRATION_MARKER_KEY);
    migrateToProjectStorage();

    expect(localStorage.getItem(scopedKey(TASKS, "B"))).toBe(bValue);
    expect(localStorage.getItem(scopedKey(TASKS, DEFAULT_PROJECT_ID))).toBe(TASKS_V1);
    expect(readLogicalRaw(TASKS)).toBe(bValue); // 選択中はBのまま
  });

  it("まだ選択の記録が無ければ、移行したプロジェクトを記録する", () => {
    localStorage.setItem(TASKS, TASKS_V1);

    migrateToProjectStorage();

    expect(localStorage.getItem(ACTIVE_PROJECT_KEY)).toBe(DEFAULT_PROJECT_ID);
  });
});

// 「使用中プロジェクトが読めなかった」を「未設定」と同じ扱いにすると、
// どのプロジェクトを見ているか分からないまま既定側の内容を読み書きしてしまう。
describe("使用中プロジェクトの読み取り失敗", () => {
  it("non-default選択中に読み取りが失敗しても、defaultの内容を返さない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");
    safeSetItem(TASKS, [{ id: "b", text: "Bの記録" }]);

    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === ACTIVE_PROJECT_KEY) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const read = tryReadLogicalRaw(TASKS);
    vi.restoreAllMocks();

    expect(read.ok).toBe(false); // 分からないので「読めなかった」を返す
  });

  it("読み取りが失敗している間は、保存もしない（別プロジェクトを潰さない）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");
    safeSetItem(TASKS, [{ id: "b", text: "Bの記録" }]);
    const bValue = localStorage.getItem(scopedKey(TASKS, "B"));

    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === ACTIVE_PROJECT_KEY) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const ok = safeSetItem(TASKS, [{ id: "x", text: "初期値" }]);
    vi.restoreAllMocks();

    expect(ok).toBe(false);
    expect(localStorage.getItem(scopedKey(TASKS, "B"))).toBe(bValue); // Bは無傷
    expect(localStorage.getItem(scopedKey(TASKS, DEFAULT_PROJECT_ID))).toBe(TASKS_V1); // defaultも無傷
  });
});

describe("使用中プロジェクトの判定（3つの状態を区別する）", () => {
  it("正常に読めるときは、その値を返す", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");

    expect(tryGetActiveProjectId()).toEqual({ ok: true, projectId: "B" });
  });

  it("未設定のときは、移行を受けたプロジェクトを返す", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    localStorage.removeItem(ACTIVE_PROJECT_KEY);

    expect(tryGetActiveProjectId()).toEqual({ ok: true, projectId: DEFAULT_PROJECT_ID });
  });

  it("読み取りが例外のときは、値を返さず「読めなかった」を返す", () => {
    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === ACTIVE_PROJECT_KEY) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const active = tryGetActiveProjectId();
    vi.restoreAllMocks();

    expect(active).toEqual({ ok: false });
  });

  it("読み取りに失敗したら初期化を保存しない印（loaded:false）を返し、復旧後も書かない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");
    safeSetItem(TASKS, [{ id: "b", text: "Bの記録" }]);
    const bValue = localStorage.getItem(scopedKey(TASKS, "B"));

    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === ACTIVE_PROJECT_KEY) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const state = loadInitialState(TASKS, [{ id: "x", text: "初期値" }]);
    vi.restoreAllMocks(); // ここでストレージが復旧する

    expect(state.loaded).toBe(false); // フックはこの印を見て保存を見送る
    expect(localStorage.getItem(scopedKey(TASKS, "B"))).toBe(bValue);
  });

  it("正常に読めたときは loaded:true になり、これまで通り保存される", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    const state = loadInitialState<unknown>(TASKS, []);

    expect(state.loaded).toBe(true);
    expect(state.value).toEqual([{ id: "1", text: "書く" }]);
  });
});

// 印が「無い／壊れている」と「一時的に読めない」は別物。
// 読めない間に旧キーへ読み書きすると、印が復旧したあと v2 が正本に戻り、その変更が消える。
describe("印の読み取り失敗（未移行と取り違えない）", () => {
  function throwOnMarkerRead() {
    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === MIGRATION_MARKER_KEY) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });
  }

  it("印が無いときは未移行として扱い、旧キーを読む", () => {
    localStorage.setItem(TASKS, TASKS_V1);

    expect(tryReadMarker()).toEqual({ ok: true, marker: null });
    expect(tryReadLogicalRaw(TASKS)).toEqual({ ok: true, raw: TASKS_V1 });
    expect(tryResolveWriteKey(TASKS)).toEqual({ ok: true, key: TASKS });
  });

  it("印が壊れているときは未移行として扱い、旧キーを読む", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    localStorage.setItem(MIGRATION_MARKER_KEY, "{壊れた印");

    expect(tryReadMarker()).toEqual({ ok: true, marker: null });
    expect(tryReadLogicalRaw(TASKS)).toEqual({ ok: true, raw: TASKS_V1 });
    expect(tryResolveWriteKey(TASKS)).toEqual({ ok: true, key: TASKS });
  });

  it("印が読めないときは旧キーの内容を返さない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);

    throwOnMarkerRead();
    const read = tryReadLogicalRaw(TASKS);
    vi.restoreAllMocks();

    expect(read.ok).toBe(false);
  });

  it("印が読めない間は保存しない（旧キーにも v2 にも書かない）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const v2 = localStorage.getItem(scopedKey(TASKS));

    throwOnMarkerRead();
    const ok = safeSetItem(TASKS, [{ id: "x", text: "消えてしまう変更" }]);
    vi.restoreAllMocks();

    expect(ok).toBe(false);
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(v2);
  });

  it("印が読めない間は移行を走らせない（既存の v2 を触らない）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const v2 = localStorage.getItem(scopedKey(TASKS));
    const marker = localStorage.getItem(MIGRATION_MARKER_KEY);

    throwOnMarkerRead();
    const result = migrateToProjectStorage();
    vi.restoreAllMocks();

    expect(result.status).toBe("failed");
    expect(result.reason).toBe("marker unreadable");
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(v2);
    expect(localStorage.getItem(MIGRATION_MARKER_KEY)).toBe(marker);
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1);
  });

  it("印が読めないときは初期化を保存しない印（loaded:false）を返す", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const v2 = localStorage.getItem(scopedKey(TASKS));

    throwOnMarkerRead();
    const state = loadInitialState(TASKS, [{ id: "x", text: "初期値" }]);
    vi.restoreAllMocks();

    expect(state.loaded).toBe(false);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(v2);
  });

  it("印の読み取りが復旧したら、再び v2 を読む（旧キーへ書いた変更は無い）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const v2 = localStorage.getItem(scopedKey(TASKS));

    throwOnMarkerRead();
    expect(tryReadLogicalRaw(TASKS).ok).toBe(false);
    expect(safeSetItem(TASKS, [{ id: "x", text: "消えてしまう変更" }])).toBe(false);
    vi.restoreAllMocks();

    expect(readLogicalRaw(TASKS)).toBe(v2);
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1);
  });

  it("使用中プロジェクトが未設定で印も読めないときは、default へ倒さない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    localStorage.removeItem(ACTIVE_PROJECT_KEY);

    throwOnMarkerRead();
    const active = tryGetActiveProjectId();
    vi.restoreAllMocks();

    expect(active).toEqual({ ok: false });
  });
});

describe("プロジェクト切替の購読", () => {
  it("切替に成功したら購読者へ知らせる", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    const seen: string[] = [];
    const stop = subscribeActiveProject(() => {
      seen.push(getActiveProjectId());
    });

    expect(setActiveProject("B")).toBe(true);
    expect(seen).toEqual(["B"]);

    stop();
    expect(setActiveProject("C")).toBe(true);
    expect(seen).toEqual(["B"]); // 解除後は増えない
  });

  it("同じプロジェクトへの切替では知らせない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");

    let calls = 0;
    const stop = subscribeActiveProject(() => {
      calls += 1;
    });

    expect(setActiveProject("B")).toBe(true);
    expect(calls).toBe(0);
    stop();
  });

  it("購読者が再読み込みしてから保存すると、旧プロジェクトへは書かない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "a", text: "Aの作業" }]);
    const aValue = localStorage.getItem(scopedKey(TASKS, DEFAULT_PROJECT_ID));

    let snapshot = loadInitialState(TASKS, [] as { id: string; text: string }[]);
    expect(snapshot.value).toEqual([{ id: "a", text: "Aの作業" }]);
    expect(snapshot.boundProject).toBe(DEFAULT_PROJECT_ID);

    const stop = subscribeActiveProject(() => {
      snapshot = loadInitialState(TASKS, [] as { id: string; text: string }[]);
    });

    expect(setActiveProject("B")).toBe(true);
    expect(snapshot.boundProject).toBe("B");
    expect(snapshot.value).toEqual([]);

    safeSetItem(TASKS, [{ id: "b", text: "Bの作業" }]);
    stop();

    expect(localStorage.getItem(scopedKey(TASKS, DEFAULT_PROJECT_ID))).toBe(aValue);
    expect(localStorage.getItem(scopedKey(TASKS, "B"))).toBe(
      '[{"id":"b","text":"Bの作業"}]',
    );
  });

  it("切替後に再読み込みしない画面状態は、新プロジェクトと boundProject が食い違う", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    const stale = loadInitialState(TASKS, [] as { id: string; text: string }[]);
    expect(stale.boundProject).toBe(DEFAULT_PROJECT_ID);

    expect(setActiveProject("B")).toBe(true);

    const active = tryGetActiveProjectId();
    expect(active).toEqual({ ok: true, projectId: "B" });
    expect(stale.boundProject).not.toBe(active.ok ? active.projectId : "");
    expect(stale.value).toEqual([{ id: "1", text: "書く" }]); // 旧プロジェクトの値のまま

    const fresh = loadInitialState(TASKS, [] as { id: string; text: string }[]);
    expect(fresh.boundProject).toBe("B");
    expect(fresh.value).toEqual([]);
  });
});

// localStorage の読み取りは3つの状態がある。
//   ①読めた・値あり ②読めた・値なし ③読めなかった
// ③を②と同じに扱うと、既存の内容を上書きしたり、空のバックアップを作ってしまう。
describe("読み取りの三状態（復旧と書き出し）", () => {
  it("復旧中に既存のv2が読めないときは、旧キーで上書きせず中止する", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const edited = localStorage.getItem(scopedKey(TASKS));
    localStorage.removeItem(MIGRATION_MARKER_KEY);

    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === scopedKey(TASKS)) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const result = migrateToProjectStorage();
    vi.restoreAllMocks();

    expect(result.status).toBe("unavailable"); // 状態を読めずに中止したことを伝える
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(edited); // 上書きしない
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 旧キーも無傷
    expect(isMigrated()).toBe(false); // 印も作らない
  });

  it("復旧中に使用中プロジェクトが読めないときは、未設定扱いせず中止する", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    setActiveProject("B");
    localStorage.removeItem(MIGRATION_MARKER_KEY);

    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === ACTIVE_PROJECT_KEY) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const result = migrateToProjectStorage();
    vi.restoreAllMocks();

    expect(result.status).toBe("unavailable"); // 状態を読めずに中止したことを伝える
    expect(localStorage.getItem(ACTIVE_PROJECT_KEY)).toBe("B"); // defaultへ潰さない
    expect(isMigrated()).toBe(false);
  });

  it("書き出しは、読み取れないときに空のバックアップを作らない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();

    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === MIGRATION_MARKER_KEY) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });

    const result = buildExport();
    vi.restoreAllMocks();

    expect(result.ok).toBe(false);
  });

  it("値が無いだけのときは、これまで通り書き出せる", () => {
    const result = buildExport();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const parsed = JSON.parse(result.json) as { version: number; data: Record<string, unknown> };
    expect(parsed.version).toBe(1); // 形式は据え置き
    expect(parsed.data[TASKS]).toBeNull(); // 未保存は null のまま
  });
});

// 復旧が「状態を読めない」で中止すると、印は無いまま残る。
// このとき「印が無い＝未移行」と解釈すると、凍結された旧キーを正本として扱ってしまい、
// 保持したはずの新しい v2 を古い内容で上書きしかねない。
describe("復旧に失敗した後の扱い", () => {
  const suspendScopedRead = () => {
    const realGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      k: string,
    ) {
      if (k === scopedKey(TASKS)) throw new DOMException("SecurityError");
      return realGetItem.call(this, k);
    });
  };

  it("復旧の中止が呼び出し側へ伝わる（unavailable）", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    localStorage.removeItem(MIGRATION_MARKER_KEY);

    suspendScopedRead();
    const result = migrateToProjectStorage();
    vi.restoreAllMocks();

    expect(result.status).toBe("unavailable");
  });

  it("復旧に失敗した後は、旧キーを正本として読まない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    localStorage.removeItem(MIGRATION_MARKER_KEY);

    // 印は無いが、v2 は残っている＝移行済みで印だけ失われた状態
    const read = tryReadLogicalRaw(TASKS);

    expect(read.ok).toBe(false); // 旧キーへ戻らない
  });

  it("復旧に失敗した後は、v2へ書き込まない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    const edited = localStorage.getItem(scopedKey(TASKS));
    localStorage.removeItem(MIGRATION_MARKER_KEY);

    const ok = safeSetItem(TASKS, [{ id: "x", text: "古いstate" }]);

    expect(ok).toBe(false);
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(edited); // v2 は無傷
    expect(localStorage.getItem(TASKS)).toBe(TASKS_V1); // 旧キーも無傷
  });

  it("復旧に失敗した後は、書き出しを作らない", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    migrateToProjectStorage();
    safeSetItem(TASKS, [{ id: "2", text: "移行後に書いた" }]);
    localStorage.removeItem(MIGRATION_MARKER_KEY);

    suspendScopedRead();
    const result = buildExport();
    vi.restoreAllMocks();

    expect(result.ok).toBe(false); // 古い内容のバックアップを作らない
  });

  it("正常な未移行（v2が無い）状態は、これまで通り移行できる", () => {
    localStorage.setItem(TASKS, TASKS_V1);
    localStorage.setItem(LINKS, LINKS_V1);

    expect(tryReadLogicalRaw(TASKS)).toEqual({ ok: true, raw: TASKS_V1 });

    const result = migrateToProjectStorage();

    expect(result.status).toBe("migrated");
    expect(localStorage.getItem(scopedKey(TASKS))).toBe(TASKS_V1);
  });
});
