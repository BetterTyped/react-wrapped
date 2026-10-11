import { createRng } from "./rng";

describe("createRng", () => {
  it("gives the same numbers for the same seed, so a shared link plays the same video", () => {
    // Arrange
    const first = createRng("octocat");
    const second = createRng("octocat");

    // Act
    const a = [first.next(), first.next(), first.next()];
    const b = [second.next(), second.next(), second.next()];

    // Assert
    expect(a).toEqual(b);
  });
});
