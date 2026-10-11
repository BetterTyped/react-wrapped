import { beamFrames, placeholderYear, weekFrames } from "./loading-sweep";

const offsets = (frames: Keyframe[]) => frames.map((frame) => Number(frame.offset));
const places = Array.from({ length: 53 }, (_unused, week) => week / 52);

describe("weekFrames", () => {
  it("gives every week keyframes the browser accepts: offsets from 0 to 1, never going back", () => {
    for (const place of places) {
      // Act
      const at = offsets(weekFrames(place));

      // Assert
      expect(at[0]).toBe(0);
      expect(at.at(-1)).toBe(1);
      expect(at.every((offset, index) => index === 0 || offset > at[index - 1])).toBe(true);
    }
  });

  it("ends each loop on the light it starts the next one with, so the loop has no seam", () => {
    for (const place of places) {
      // Act
      const frames = weekFrames(place);

      // Assert
      expect(frames.at(-1)?.opacity).toBe(frames[0].opacity);
      expect(frames.at(-1)?.filter).toBe(frames[0].filter);
    }
  });

  it("lights a week fully on both crossings and lets it go dark in between", () => {
    // Act
    const light = weekFrames(0.5).map((frame) => Number(frame.opacity));

    // Assert
    const peaks = light.filter((value, index) => value === 1 && light[index - 1] !== 1);
    expect(peaks).toHaveLength(2);
    expect(light[0]).toBe(0);
  });

  it("keeps the first week glowing over the loop's end, where the beam has only just left it", () => {
    // Act
    const frames = weekFrames(0);

    // Assert
    expect(Number(frames[0].opacity)).toBeGreaterThan(0);
  });
});

describe("beamFrames", () => {
  it("crosses the year and comes back to where it started", () => {
    // Act
    const frames = beamFrames();

    // Assert
    const at = offsets(frames);
    expect(at.every((offset, index) => index === 0 || offset >= at[index - 1])).toBe(true);
    expect(frames[0].transform).toBe("translateX(0%)");
    expect(frames.some((frame) => frame.transform === "translateX(100%)")).toBe(true);
    expect(frames.at(-1)?.transform).toBe("translateX(0%)");
  });
});

describe("placeholderYear", () => {
  it("draws the same year for the same person and a different one for someone else", () => {
    // Act
    const first = placeholderYear("ada");
    const again = placeholderYear("ada");
    const other = placeholderYear("torvalds");

    // Assert
    expect(again).toEqual(first);
    expect(other).not.toEqual(first);
    expect(first).toHaveLength(53);
    expect(first.flat().every((level) => level >= 0 && level <= 4)).toBe(true);
  });
});
