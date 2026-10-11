import { cutDrops } from "./cut-drops";

const achievement = (id: string) => ({ id, kind: "achievement" });
const egg = (id: string) => ({ id, kind: "easterEgg" });

describe("cutDrops", () => {
  it("keeps one easter egg however many were rolled", () => {
    // Arrange
    const traits = { drops: [achievement("a"), egg("first"), egg("second"), egg("third")], earned: [achievement("a")] };

    // Act
    const drops = cutDrops(traits, (trait) => trait.id);

    // Assert
    expect(drops.map((drop) => drop.id)).toEqual(["a", "first"]);
  });

  it("gives a scene only to achievements that draw a chart, taking the next hardest in their place", () => {
    // Arrange
    const traits = {
      drops: [achievement("no-chart"), achievement("streak"), egg("egg")],
      earned: [achievement("no-chart"), achievement("streak"), achievement("months")],
    };

    // Act
    const drops = cutDrops(traits, (trait) => (trait.id === "no-chart" ? null : trait.id));

    // Assert
    expect(drops.map((drop) => drop.id)).toEqual(["streak", "months", "egg"]);
  });

  it("does not draw the same picture twice", () => {
    // Arrange
    const tiers = [achievement("hundred-thousand"), achievement("ten-thousand"), achievement("thousand")];
    const traits = { drops: [...tiers, egg("egg")], earned: [...tiers, achievement("streak")] };

    // Act
    const drops = cutDrops(traits, (trait) => (trait.id === "streak" ? "streak" : "running-total"));

    // Assert
    expect(drops.map((drop) => drop.id)).toEqual(["hundred-thousand", "streak", "egg"]);
  });

  it("leaves a thin year with a short hunt instead of filling it up", () => {
    // Arrange
    const traits = { drops: [achievement("a"), egg("one"), egg("two"), egg("three")], earned: [achievement("a")] };

    // Act
    const drops = cutDrops(traits, () => null);

    // Assert
    expect(drops.map((drop) => drop.id)).toEqual(["one"]);
  });
});
