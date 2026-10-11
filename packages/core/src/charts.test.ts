import { packBubbles, ringDash } from "./charts";

/** What a ring with round ends actually lights: the dash, plus half the stroke past each end of it. */
const lit = (share: number, length: number, stroke: number) => ringDash(share, length, stroke) + stroke;

describe("ringDash", () => {
  // The outer ring of the languages chart: radius 147, stroke 26.
  const length = 2 * Math.PI * 147;
  const stroke = 26;

  it("leaves the rest of the ring dark: 97% is not a full circle", () => {
    // Act
    const gap = length - lit(0.97, length, stroke);

    // Assert: the 3% that was not TypeScript stays open. The ends used to meet and close it.
    expect(gap).toBeCloseTo(length * 0.03, 5);
    expect(gap).toBeGreaterThan(20);
  });

  it("lights exactly the share, ends included", () => {
    expect(lit(0.5, length, stroke)).toBeCloseTo(length / 2, 5);
    expect(lit(1, length, stroke)).toBeCloseTo(length, 5);
  });

  it("draws a share shorter than the stroke as a dot, never a negative dash", () => {
    // Act
    const dash = ringDash(0.01, length, stroke);

    // Assert
    expect(dash).toBeGreaterThan(0);
    expect(dash).toBeLessThan(1);
  });
});

describe("packBubbles", () => {
  it("packs the discs around the biggest so they almost touch and never overlap, whatever their sizes", () => {
    // Arrange: one dominant part, five equal ones, and a long tail.
    const mixes = [
      [60, 20, 10, 5, 5],
      [20, 20, 20, 20, 20],
      [75, 10, 8, 6, 1],
      [50, 50],
    ];

    // Act
    const gaps = mixes.flatMap((shares) => {
      const discs = packBubbles(shares);
      return discs.flatMap((a, index) =>
        discs.slice(index + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius),
      );
    });

    // Assert: no pair overlaps, and area follows the share (a quarter of the share is half the radius).
    expect(Math.min(...gaps)).toBeGreaterThan(0);
    expect(packBubbles([80, 20])[1].radius).toBeCloseTo(0.5);
  });
});
