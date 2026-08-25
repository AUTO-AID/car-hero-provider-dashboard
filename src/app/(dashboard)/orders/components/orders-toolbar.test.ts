import { describe, expect, it } from "vitest";
import { defaultSortFor, resolveSort, sortOptionsFor } from "./orders-toolbar";

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
