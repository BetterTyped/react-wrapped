import { FORMATS, giveSvgABox, playScene } from "../testing/stage";
import { fullYear, thinYear } from "../testing/years";
import { directSample, playSampleTraits } from "./director";
import { sampleTraits } from "./traits";
import type { SampleYear } from "./year";

/** The whole cut of a year, every drop found. */
function everyScene(year: SampleYear) {
  const traits = sampleTraits(year);
  const everything = playSampleTraits(year, traits).drops.map((drop) => drop.id);
  return directSample(year, traits, everything).scenes;
}

beforeAll(giveSvgABox);

// Building a scene in jsdom takes a while, and longer on a busy machine.
describe("the sample video's console", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["a full year", fullYear],
    ["a year with almost nothing in it", thinYear],
  ])(
    "stays quiet while every scene of %s is built: no scene tweens a part it did not render",
    (_name, makeYear) => {
      // Arrange
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const scenes = everyScene(makeYear());

      // Act
      for (const scene of scenes) for (const format of FORMATS) playScene(scene, format);

      // Assert
      const aboutTargets = warn.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("GSAP"));
      expect(scenes.length).toBeGreaterThan(5);
      expect(aboutTargets).toEqual([]);
    },
    240_000,
  );
});
