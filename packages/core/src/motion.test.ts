import { gsap } from "gsap";

import { fitScene, headingLines, linesIn, readingSeconds, riseIn, wordsToRead } from "./motion";

describe("headingLines", () => {
  it("balances a heading across two lines at a word", () => {
    // Act
    const lines = headingLines("My year in commits.");

    // Assert
    expect(lines).toEqual(["My year in", "commits."]);
  });

  it("never splits a marked phrase, so its stars stay together", () => {
    // Act
    const lines = headingLines("Shipped *a lot* this year.");

    // Assert
    expect(lines.some((line) => line.includes("*a lot*"))).toBe(true);
  });

  it("keeps the viewer's own line breaks", () => {
    // Act
    const lines = headingLines("One\nTwo three");

    // Assert
    expect(lines).toEqual(["One", "Two three"]);
  });
});

describe("wordsToRead", () => {
  it("counts a sentence in full, however it was split into runs", () => {
    // Act
    const words = wordsToRead(["Only about", "1 in 71", "scans turns this one up."]);

    // Assert
    expect(words).toBe(10);
  });

  it("does not count the ticks under a chart as words of reading", () => {
    // Arrange
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

    // Act
    const words = wordsToRead(months);

    // Assert
    expect(words).toBeLessThan(2);
  });

  it("counts a word or a number on its own as less than a word of a sentence", () => {
    // Act
    const words = wordsToRead(["Legendary", "1,107", "   "]);

    // Assert
    expect(words).toBeCloseTo(1.2);
  });
});

describe("readingSeconds", () => {
  it("keeps a long description up longer than a short one", () => {
    // Arrange
    const short = ["Streak Lord", "Rare", "Hoards green checkmarks."];
    const long = [
      "Familiar: Merge Dragon",
      "Legendary",
      "It guards green checkmarks and keeps main clean. May your CI stay green all next year.",
    ];

    // Act
    const seconds = { short: readingSeconds(short), long: readingSeconds(long) };

    // Assert
    expect(seconds.long - seconds.short).toBeGreaterThan(3);
    expect(seconds.short).toBeGreaterThan(2);
  });
});

/** A scene in a frame 1080 tall with the square format's padding, and parts laid out where the test says. */
function laidOut(parts: readonly { top: number; height: number; marginBottom?: number; absolute?: boolean }[]) {
  const root = document.createElement("section");
  root.style.paddingTop = "170px";
  root.style.paddingBottom = "120px";
  Object.defineProperty(root, "clientHeight", { value: 1080 });
  const made = parts.map((part) => {
    const element = document.createElement("div");
    if (part.absolute) element.style.position = "absolute";
    if (part.marginBottom) element.style.marginBottom = `${part.marginBottom}px`;
    Object.defineProperty(element, "offsetTop", { value: part.top });
    Object.defineProperty(element, "offsetHeight", { value: part.height });
    root.append(element);
    return element;
  });
  return { root, made };
}

/** How much a part was shrunk: 1 when it was left alone. */
const shrunkTo = (part: HTMLElement) => Number(part.style.getPropertyValue("--wr-fit") || 1);

describe("fitScene", () => {
  it("leaves a scene that fits exactly as it was drawn", () => {
    // Arrange: 700 of content in the 790 between the header row and the footer.
    const { root, made } = laidOut([
      { top: 215, height: 200 },
      { top: 415, height: 500 },
    ]);

    // Act
    fitScene(root);

    // Assert
    expect(made.map(shrunkTo)).toEqual([1, 1]);
  });

  it("shrinks every part of a scene that is too tall by the same amount, until it fits", () => {
    // Arrange: a list that needs 988 of the 790 there is, with a burst behind it that is not part of the layout.
    const { root, made } = laidOut([
      { top: 46, height: 288 },
      { top: 334, height: 700 },
      { top: 0, height: 1080, absolute: true },
    ]);

    // Act
    fitScene(root);

    // Assert: 790 / 988.
    expect(made.map(shrunkTo)).toEqual([0.8, 0.8, 1]);
  });

  it("counts the margin under the last part, which is what pushed a short scene over the header", () => {
    // Arrange: 780 of content fits on its own, but its bottom margin makes the block 820.
    const { root, made } = laidOut([{ top: 150, height: 780, marginBottom: 40 }]);

    // Act
    fitScene(root);

    // Assert: 790 / 820.
    expect(shrunkTo(made[0])).toBe(0.963);
  });

  it("never shrinks a scene so far that it cannot be read", () => {
    // Arrange: twice the room.
    const { root, made } = laidOut([{ top: -250, height: 1580 }]);

    // Act
    fitScene(root);

    // Assert
    expect(shrunkTo(made[0])).toBe(0.6);
  });
});

describe("riseIn", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips a part the scene did not render, without a word in the console", () => {
    // Arrange: a scene with a headline and nothing else, asked for parts it does not have.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = document.createElement("section");
    root.innerHTML = '<h2><span class="wr-line"><span>Hello</span></span></h2>';
    const tl = gsap.timeline({ paused: true });

    // Act
    riseIn(tl, root.querySelector(".wr-eyebrow"), { at: 0 });
    riseIn(tl, root.querySelectorAll(".wr-rise"), { at: 0 });
    linesIn(tl, document.createElement("section"), { at: 0 });

    // Assert
    expect(tl.getChildren()).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("still brings in the parts that are there", () => {
    // Arrange
    const root = document.createElement("section");
    root.innerHTML = '<p class="wr-rise">One</p><p class="wr-rise">Two</p>';
    const tl = gsap.timeline({ paused: true });

    // Act
    riseIn(tl, root.querySelectorAll(".wr-rise"), { at: 0.5 });

    // Assert
    const [tween] = tl.getChildren();
    expect(tween.targets()).toHaveLength(2);
    expect(tween.startTime()).toBe(0.5);
  });
});
