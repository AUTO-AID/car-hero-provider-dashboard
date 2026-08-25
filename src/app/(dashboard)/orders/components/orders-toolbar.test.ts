import { describe, expect, it } from "vitest";
import { defaultSortFor, periodStart, resolveSort, sortOptionsFor } from "./orders-toolbar";

describe("resolveSort", () => {
  /**
   * هذا هو العقد الذي يقوم عليه التسخين المسبق: النقر والتسخين يحسبان الفرز
   * بالدالة نفسها، فيتطابق مفتاح الذاكرة مع مفتاح الطلب. لو انفصلا لعاد
   * انتظار الشبكة عند كل نقرة بلا أيّ عطل ظاهر يدلّ على السبب.
   */
  it("keeps the current sort when the target group supports it", () => {
    expect(resolveSort("completed", "amount")).toBe("amount");
    expect(resolveSort("all", "oldest")).toBe("oldest");
    expect(resolveSort("scheduled", "amount")).toBe("amount");
  });

  it("falls back to the group default when the current sort is meaningless there", () => {
    // «الأحدث» لا معنى له بين المواعيد، و«الموعد الأقرب» لا معنى له خارجها
    expect(resolveSort("scheduled", "newest")).toBe("soonest");
    expect(resolveSort("all", "soonest")).toBe("newest");
    expect(resolveSort("cancelled", "latest")).toBe("newest");
  });

  it("always resolves to a sort the group actually offers", () => {
    const groups = ["all", "active", "scheduled", "completed", "cancelled"] as const;
    const sorts = ["newest", "oldest", "soonest", "latest", "amount"] as const;

    for (const group of groups) {
      const offered = sortOptionsFor(group).map((option) => option.value);
      expect(offered).toContain(defaultSortFor(group));
      for (const sort of sorts) {
        expect(offered).toContain(resolveSort(group, sort));
      }
    }
  });
});

describe("periodStart", () => {
  it("returns no lower bound for the full history", () => {
    expect(periodStart("all")).toBeUndefined();
  });

  it("anchors every preset to the start of a day so the key stays stable across renders", () => {
    expect(periodStart("today")).toBe(periodStart("today"));
    const start = new Date(periodStart("7d")!);
    expect([start.getHours(), start.getMinutes(), start.getSeconds()]).toEqual([0, 0, 0]);
  });

  it("orders the presets from nearest to furthest back", () => {
    const at = (key: "today" | "7d" | "30d" | "12m") => new Date(periodStart(key)!).getTime();
    expect(at("today")).toBeGreaterThan(at("7d"));
    expect(at("7d")).toBeGreaterThan(at("30d"));
    expect(at("30d")).toBeGreaterThan(at("12m"));
  });
});
