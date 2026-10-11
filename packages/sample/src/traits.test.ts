import { thinYear } from "../testing/years";
import { RARITY_ORDER, sampleTraits } from "./traits";
import { sampleYear } from "./year";

describe("the sample roll", () => {
  it("is the same roll every time for the same year", () => {
    // Arrange
    const year = sampleYear("ada");

    // Act
    const first = sampleTraits(year);
    const again = sampleTraits(year);

    // Assert
    expect(again).toEqual(first);
  });

  it("hides exactly one easter egg, whoever the year belongs to", () => {
    // Arrange
    const handles = ["ada", "grace", "linus", "alan", "margaret", "dennis"];

    // Act
    const eggs = handles.map(
      (handle) => sampleTraits(sampleYear(handle)).drops.filter((drop) => drop.kind === "easterEgg").length,
    );

    // Assert
    expect(eggs).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("lists what the year earned hardest first, with lines that say the year's own numbers", () => {
    // Arrange
    const year = sampleYear("ada");

    // Act
    const { earned, type } = sampleTraits(year);
    const ranks = earned.map((trait) => RARITY_ORDER.indexOf(trait.rarity));

    // Assert
    expect(ranks).toEqual(ranks.toSorted((a, b) => a - b));
    expect(earned.find((trait) => trait.id === "long-haul")?.line).toContain(`${year.streak.length} days in a row`);
    expect(type.line).toContain(String(year.streak.length));
  });

  it("gives a thin year the everyday type and no achievement it did not earn", () => {
    // Arrange
    const year = thinYear();

    // Act
    const { type, earned } = sampleTraits(year);

    // Assert
    expect(type.id).toBe("metronome");
    expect(earned.map((trait) => trait.id)).toEqual(["shore-leave"]);
  });
});
