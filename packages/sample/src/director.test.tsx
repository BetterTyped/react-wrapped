import { FORMATS, giveSvgABox, mountScene, playScene } from "../testing/stage";
import { fullYear, thinYear } from "../testing/years";
import { directSample, playSampleTraits } from "./director";
import { sampleTraits } from "./traits";
import { sampleYear } from "./year";
import { cutDrops, RARITY_LABELS, type SceneInstance } from "@react-wrapped/core";

const STORY = [
  "opening",
  "total",
  "week",
  "biggest-day",
  "streak",
  "repositories",
  "languages",
  "shape",
  "type",
  "trophies",
  "share-card",
];

const keysOf = (scenes: readonly SceneInstance[]) => scenes.map((scene) => scene.key);
const isDrop = (scene: SceneInstance) => scene.key.startsWith("drop-");

/** The default year with its roll, and the cut with every drop found. */
function sample(handle = "ada") {
  const year = sampleYear(handle);
  const traits = sampleTraits(year);
  const everything = playSampleTraits(year, traits).drops.map((drop) => drop.id);
  return { year, traits, everything, full: directSample(year, traits, everything) };
}

beforeAll(giveSvgABox);

describe("the sample director", () => {
  it("tells the story in order before anything has been found", () => {
    // Arrange
    const { year, traits } = sample();

    // Act
    const cut = directSample(year, traits, []);

    // Assert
    expect(keysOf(cut.scenes)).toEqual(STORY);
    expect(cut.subject).toEqual({
      handle: "ada",
      name: null,
      avatarUrl: null,
      caption: "Orbit Wrapped",
      period: "Oct 2025 to Oct 2026",
    });
  });

  it("slots every found drop in behind the scene it continues, and leaves the story as it was", () => {
    // Arrange
    const { full } = sample();

    // Act
    const keys = keysOf(full.scenes);

    // Assert
    expect(keys).toEqual([
      "opening",
      "total",
      "drop-second-wind",
      "week",
      "drop-clean-sheet",
      "biggest-day",
      "streak",
      "drop-long-haul",
      "repositories",
      "languages",
      "shape",
      "type",
      "drop-comet-dragon",
      "trophies",
      "share-card",
    ]);
    expect(keys.filter((key) => !key.startsWith("drop-"))).toEqual(STORY);
  });

  it.each(["ada", "grace", "linus", "alan", "margaret"])(
    "gives every scene of %s's video its own key and never plays two drops back to back",
    (handle) => {
      // Arrange
      const { full } = sample(handle);

      // Act
      const keys = keysOf(full.scenes);
      const backToBack = full.scenes.filter(
        (scene, index) => index > 0 && isDrop(scene) && isDrop(full.scenes[index - 1]),
      );

      // Assert
      expect(new Set(keys).size).toBe(keys.length);
      expect(keysOf(backToBack)).toEqual([]);
    },
  );

  it("plays the same video every time for the same roll", () => {
    // Arrange
    const { year, traits, everything, full } = sample();

    // Act
    const again = directSample(year, traits, everything);

    // Assert
    expect(again.scenes.map((scene) => scene.signature)).toEqual(full.scenes.map((scene) => scene.signature));
    expect(again.seed).toBe(full.seed);
  });

  it("hides at most one easter egg among the drops", () => {
    // Arrange
    const { full } = sample();

    // Act
    const eggs = full.drops.filter((drop) => drop.kind === "Easter egg");
    const others = full.drops.filter((drop) => drop.kind !== "Easter egg");

    // Assert
    expect(eggs).toHaveLength(1);
    expect(others.map((drop) => drop.kind)).toEqual(["Achievement", "Achievement", "Achievement"]);
  });

  it("keeps one egg and one achievement per picture, whatever the roll holds", () => {
    // Arrange
    const { year, traits } = sample();
    const greedy = {
      ...traits,
      drops: [...traits.earned, ...traits.drops.filter((drop) => drop.kind === "easterEgg")],
    };

    // Act
    const samePicture = cutDrops(greedy, () => "one picture");
    const played = playSampleTraits(year, playSampleTraits(year, traits));

    // Assert
    expect(samePicture.map((drop) => drop.kind)).toEqual(["achievement", "easterEgg"]);
    expect(played.drops).toEqual(playSampleTraits(year, traits).drops);
  });

  it("draws at least three different charts across the achievement scenes", () => {
    // Arrange
    const { full } = sample();
    const achievements = full.scenes.filter(isDrop).filter((scene) => scene.key !== "drop-comet-dragon");

    // Act
    const charts = achievements.map((scene) =>
      mountScene(scene).querySelector(".wr-chart")?.getAttribute("data-chart"),
    );

    // Assert
    expect(charts).toEqual(["dumbbell", "month", "spark"]);
    expect(new Set(charts).size).toBeGreaterThanOrEqual(3);
  });

  it("shows a found drop as its name, its rarity in one word, and one description", () => {
    // Arrange
    const { full } = sample();
    const rarities = Object.values(RARITY_LABELS);

    // Act
    const drops = full.scenes.filter(isDrop).map((scene) => {
      const root = mountScene(scene);
      return {
        stamp: root.querySelector(".wr-stamp")?.textContent ?? "",
        labels: root.querySelectorAll(".wr-eyebrow").length,
        descriptions: root.querySelectorAll(".wr-lede").length,
      };
    });

    // Assert
    for (const drop of drops) {
      expect(rarities).toContain(drop.stamp);
      expect(drop).toMatchObject({ labels: 0, descriptions: 1 });
    }
  });

  it("gives the easter egg its pixel art, what it means, and its odds", () => {
    // Arrange
    const { full } = sample();
    const egg = full.scenes.find((scene) => scene.key === "drop-comet-dragon");
    if (!egg) throw new Error("The video has no easter egg scene.");

    // Act
    const root = mountScene(egg);

    // Assert
    expect(root.querySelector(".wr-pixel")).not.toBeNull();
    expect(root.querySelector(".wr-chart")).toBeNull();
    expect(root.querySelector(".wr-lede")).toHaveTextContent("Only about 1 in 25 scans turns this one up.");
  });

  it("moves an opened drop out of pending and adds its scene, rebuilding only the scenes that show it", () => {
    // Arrange
    const { year, traits } = sample();
    const before = directSample(year, traits, []);
    const [next, ...rest] = before.pending;

    // Act
    const after = directSample(year, traits, [next.id]);
    const signatures = new Map(before.scenes.map((scene) => [scene.key, scene.signature]));
    const changed = after.scenes.filter(
      (scene) => signatures.has(scene.key) && signatures.get(scene.key) !== scene.signature,
    );

    // Assert
    expect(before.pending.map((drop) => drop.id)).toEqual(before.drops.map((drop) => drop.id));
    expect(after.pending).toEqual(rest);
    expect(after.drops).toEqual(before.drops);
    expect(keysOf(after.scenes).filter((key) => !STORY.includes(key))).toEqual([`drop-${next.id}`]);
    expect(keysOf(changed)).toEqual(["trophies", "share-card"]);
  });

  it("keeps what is still hidden a question mark in the trophy case, and puts the rarest find on the card", () => {
    // Arrange
    const { year, traits, full } = sample();
    const nothing = directSample(year, traits, []);
    const trophies = nothing.scenes.find((scene) => scene.key === "trophies");
    if (!trophies) throw new Error("The video has no trophy case.");

    // Act
    const root = mountScene(trophies);

    // Assert
    expect(root.querySelectorAll(".wr-trophy[data-hidden]")).toHaveLength(nothing.pending.length);
    expect(root).not.toHaveTextContent("Comet Dragon");
    expect(nothing.card.tokens?.map((token) => token.name)).toEqual(["The Marathoner"]);
    expect(full.card.tokens?.map((token) => token.name)).toEqual(["The Marathoner", "Comet Dragon"]);
  });

  it("moves a drop to the nearest free scene when the one it continues already has a drop behind it", () => {
    // Arrange
    const year = fullYear();
    const traits = sampleTraits(year);
    const played = playSampleTraits(year, traits);

    // Act
    const cut = directSample(
      year,
      traits,
      played.drops.map((drop) => drop.id),
    );
    const keys = keysOf(cut.scenes);

    // Assert
    expect(played.drops.map((drop) => drop.id).slice(0, 2)).toEqual(["all-weather", "long-haul"]);
    expect(keys.slice(keys.indexOf("streak"), keys.indexOf("languages"))).toEqual([
      "streak",
      "drop-all-weather",
      "repositories",
      "drop-long-haul",
    ]);
    expect(keys.filter((key, index) => key.startsWith("drop-") && keys[index - 1].startsWith("drop-"))).toEqual([]);
  });

  it("still makes a video out of a year with three contributions in it", () => {
    // Arrange
    const year = thinYear();
    const traits = sampleTraits(year);

    // Act
    const cut = directSample(
      year,
      traits,
      playSampleTraits(year, traits).drops.map((drop) => drop.id),
    );

    // Assert
    expect(keysOf(cut.scenes)).toEqual([
      "opening",
      "total",
      "week",
      "biggest-day",
      "drop-shore-leave",
      "shape",
      "type",
      "drop-comet-dragon",
      "trophies",
      "share-card",
    ]);
    expect(cut.card.stats.map((stat) => stat.value)).toEqual(["4", "1 day", "2", "3"]);
  });
});

// Building a scene in jsdom takes a while, and longer on a busy machine, so each gets a minute.
describe("the sample video's scenes", () => {
  const { full } = sample();

  it.each(full.scenes.map((scene) => [scene.key, scene] as const))(
    "%s builds its animation in every format",
    (_key, scene) => {
      // Arrange
      const formats = FORMATS;

      // Act
      const seconds = formats.map((format) => playScene(scene, format));

      // Assert
      expect(formats).toEqual(["story", "square", "landscape"]);
      for (const length of seconds) expect(length).toBeGreaterThan(1);
    },
    60_000,
  );
});
