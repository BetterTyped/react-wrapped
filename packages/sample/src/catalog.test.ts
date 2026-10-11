import { fullYear } from "../testing/years";
import { SAMPLE_CATALOG } from "./catalog";
import { sampleTraits } from "./traits";
import { dropVisual } from "./visuals";

describe("the sample catalog", () => {
  it("gives every entry an id nothing else in the catalog has", () => {
    // Arrange
    const { types, achievements, eggs } = SAMPLE_CATALOG;

    // Act
    const ids = [...types, ...achievements, ...eggs].map((entry) => entry.id);

    // Assert
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("turns up exactly one easter egg per scan: the odds add up to a hundred", () => {
    // Arrange
    const { eggs } = SAMPLE_CATALOG;

    // Act
    const odds = eggs.reduce((sum, egg) => sum + egg.chance, 0);

    // Assert
    expect(odds).toBe(100);
  });

  it("has a chart of its own numbers for every achievement a year can earn", () => {
    // Arrange
    const year = fullYear();

    // Act
    const { earned } = sampleTraits(year);
    const withoutPicture = earned.filter((trait) => dropVisual(trait, year) === null).map((trait) => trait.id);

    // Assert
    expect(earned.map((trait) => trait.id).toSorted()).toEqual(
      SAMPLE_CATALOG.achievements.map((entry) => entry.id).toSorted(),
    );
    expect(withoutPicture).toEqual([]);
  });
});
