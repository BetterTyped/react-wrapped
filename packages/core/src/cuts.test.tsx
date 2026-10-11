import { render } from "@testing-library/react";
import { gsap } from "gsap";

import { configFromSearch, parseWrappedSearch } from "./config";
import {
  coverCut,
  defineTransition,
  exitScene,
  HANDOVER,
  isTransition,
  luckyCut,
  StageCover,
  transitionList,
} from "./cuts";
import { WRAPPED_TRANSITIONS } from "./types";

const COVERS = WRAPPED_TRANSITIONS.filter((style) => !["iris", "wipe", "lift", "drop", "zoom"].includes(style));

/** A stage with one scene on it and everything the cover cuts draw with. */
function mountStage() {
  const { container } = render(
    <div>
      <section data-scene />
      <StageCover format="story" />
    </div>,
  );
  const root = container.querySelector<HTMLElement>("[data-scene]");
  const cover = container.querySelector<HTMLElement>("[data-wr-cover]");
  if (!root || !cover) throw new Error("The stage did not mount.");
  return { root, cover };
}

describe("cuts between scenes", () => {
  it.each(WRAPPED_TRANSITIONS)("%s says where the next scene starts, before the cut is over", (style) => {
    // Arrange
    const { root, cover } = mountStage();
    const cut = gsap.timeline({ paused: true });

    // Act
    exitScene(cut, root, { style, cover });

    // Assert
    expect(cut.labels[HANDOVER]).toBeGreaterThan(0);
    expect(cut.labels[HANDOVER]).toBeLessThan(cut.duration());
  });

  it.each(COVERS)("%s puts every layer out of sight before the first one moves", (style) => {
    // Arrange
    const { root, cover } = mountStage();
    const layers = [...(cover.querySelector(`[data-cut="${style}"]`)?.children ?? [])];
    const resting = layers.map((layer) => layer.getAttribute("style"));
    const cut = gsap.timeline({ paused: true });
    exitScene(cut, root, { style, cover });

    // Act
    cut.time(0.01);

    // Assert
    expect(layers.length).toBeGreaterThan(0);
    layers.forEach((layer, index) => expect(layer.getAttribute("style")).not.toBe(resting[index]));
  });

  it.each(COVERS)("%s takes the old scene out and leaves nothing over the next one", (style) => {
    // Arrange
    const { root, cover } = mountStage();
    const group = cover.querySelector<HTMLElement>(`[data-cut="${style}"]`);
    const cut = gsap.timeline({ paused: true });
    exitScene(cut, root, { style, cover });

    // Act
    cut.progress(1);

    // Assert
    expect(root.style.visibility).toBe("hidden");
    expect(group?.style.visibility).toBe("hidden");
  });
});

describe("the cut a scene's luck picks", () => {
  it("stays with the scene whatever plays around it, and differs from scene to scene", () => {
    // Arrange
    const keys = ["opening", "total", "busiest", "streak", "languages", "repos", "persona", "weekdays"];

    // Act
    const first = keys.map((key) => luckyCut("ada/7", key));
    const again = keys.toReversed().map((key) => luckyCut("ada/7", key));

    // Assert
    expect(again.toReversed()).toEqual(first);
    expect(new Set(first).size).toBeGreaterThan(1);
    for (const style of first) expect(WRAPPED_TRANSITIONS).toContain(style);
  });
});

describe("a transition of your own", () => {
  // Registered once for this file, the way an app does it where it starts.
  const curtain = defineTransition({
    id: "curtain",
    label: "Curtain",
    cover: (
      <>
        <i />
        <i />
        <i />
      </>
    ),
    play: (tl, { root, group }) => {
      if (!group) return;
      coverCut(
        tl,
        { root, group },
        { hidden: { yPercent: -101 }, covering: { yPercent: 0 }, cleared: { yPercent: 101 } },
      );
    },
  });

  it("is offered next to the built-in ones, under its own name", () => {
    // Act
    const list = transitionList();

    // Assert
    expect(list.slice(0, WRAPPED_TRANSITIONS.length).map((entry) => entry.id)).toEqual([...WRAPPED_TRANSITIONS]);
    expect(list.at(-1)).toEqual({ id: "curtain", label: "Curtain" });
    expect(isTransition(curtain.id)).toBe(true);
  });

  it("draws its cover into the stage and plays it on the timeline", () => {
    // Arrange
    const { root, cover } = mountStage();
    const group = cover.querySelector<HTMLElement>('[data-cut="curtain"]');
    const tl = gsap.timeline({ paused: true });

    // Act
    exitScene(tl, root, { style: "curtain", cover });
    tl.progress(1);

    // Assert
    expect(group?.children).toHaveLength(3);
    expect(tl.labels[HANDOVER]).toBeGreaterThan(0);
    expect(tl.labels[HANDOVER]).toBeLessThan(tl.duration());
    // The old scene is gone and the cover is put away again.
    expect(gsap.getProperty(root, "opacity")).toBe(0);
    expect(gsap.getProperty(group ?? null, "opacity")).toBe(0);
  });

  it("is kept when a link names it for a scene", () => {
    // Act
    const config = configFromSearch(parseWrappedSearch({ t: "total:curtain,streak:nope" }));

    // Assert
    expect(config.cuts).toEqual({ total: "curtain" });
  });

  it("never changes what the seed picks for a video unless it asks to be picked", () => {
    // Arrange
    const keys = Array.from({ length: 40 }, (_unused, index) => `scene-${index}`);

    // Act
    const picked = keys.map((key) => luckyCut("ada", key));

    // Assert
    expect(picked).not.toContain("curtain");
    expect(picked.every((style) => (WRAPPED_TRANSITIONS as readonly string[]).includes(style))).toBe(true);
  });

  it("refuses an id a built-in transition already has", () => {
    // Assert
    expect(() => defineTransition({ id: "wipe", label: "Mine", play: () => {} })).toThrow(/built-in transition/);
    expect(() => defineTransition({ id: "Big Wipe", label: "Mine", play: () => {} })).toThrow(/lower case/);
  });

  it("leaves every scene it does not win with the transition it had, once it joins the luck", () => {
    // Arrange
    const keys = Array.from({ length: 240 }, (_unused, index) => `scene-${index}`);
    const before = keys.map((key) => luckyCut("ada", key));

    // Act: registered last in this file, so the tests above still see only built-in luck.
    defineTransition({ id: "sparkle", label: "Sparkle", lucky: true, play: () => {} });
    const after = keys.map((key) => luckyCut("ada", key));

    // Assert
    const won = after.filter((style) => style === "sparkle").length;
    expect(won).toBeGreaterThan(0);
    // About one scene in twenty, its fair share among twenty transitions: never most of the video.
    expect(won).toBeLessThan(keys.length / 5);
    expect(after.filter((style, index) => style !== "sparkle" && style !== before[index])).toEqual([]);
  });
});
