import { describe, expect, it } from "vitest";

import { countText, numberInk } from "./number-ink";

describe("numberInk", () => {
  it("moves a number that starts with a 1 further than one that starts with a full digit", () => {
    // Measured on the page before the fix: "193" sat 12px right of centre at 200px, "708" 8px.
    expect(numberInk("193").nudge * 200).toBeCloseTo(-13.4, 0);
    expect(numberInk("708").nudge * 200).toBeCloseTo(-8.7, 0);
  });

  it("says how far the first digit's ink is from the left of its box", () => {
    // "11,999" began 34px right of the text column at 300px.
    expect(numberInk("11,999").inset * 300).toBeCloseTo(34.5, 0);
    expect(numberInk("43").inset * 300).toBeCloseTo(9.9, 0);
  });

  it("measures the ink, so the widest six characters are known to need more than the column", () => {
    const column = 920;
    expect(numberInk("11,999").width * 300).toBeLessThan(column);
    expect(numberInk("88,888").width * 300).toBeGreaterThan(column);
  });

  it("leaves a character it does not know where its box puts it, tracking aside", () => {
    expect(numberInk("x").inset).toBe(0);
    expect(numberInk("x").nudge).toBeCloseTo(-0.035, 3);
    expect(numberInk("")).toEqual({ inset: 0, width: 0, nudge: 0 });
  });
});

describe("countText", () => {
  it("writes a count the way the counter lands on it", () => {
    expect(countText(11999)).toBe("11,999");
    expect(countText(69.9, "M")).toBe("69.9M");
    expect(countText(708)).toBe("708");
  });
});
