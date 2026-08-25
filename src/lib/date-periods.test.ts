import { describe, expect, it } from "vitest";
import { PERIODS, periodStart } from "./date-periods";

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

describe("PERIODS", () => {
  it("offers a key for every period the pages can request", () => {
    expect(PERIODS.map((period) => period.value)).toEqual(["all", "today", "7d", "30d", "12m"]);
  });
});
