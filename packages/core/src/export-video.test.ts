import { frameTimes } from "./export-video";

describe("frameTimes", () => {
  it("asks for one moment per frame and ends on the video's very end", () => {
    const times = frameTimes(2, 60);

    expect(times).toHaveLength(121);
    expect(times[0]).toBe(0);
    expect(times[1]).toBeCloseTo(1 / 60);
    expect(times.at(-1)).toBe(2);
  });

  it("never runs past the end when the length is not a whole number of frames", () => {
    const times = frameTimes(56.02, 60);

    expect(Math.max(...times)).toBe(56.02);
    expect(times.at(-2)).toBeLessThan(56.02);
  });
});
