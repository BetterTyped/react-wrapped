import { render } from "@testing-library/react";
import { gsap } from "gsap";

import { exitScene, HANDOVER, luckyCut, StageCover } from "./cuts";
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
    const first = keys.map((key) => luckyCut("octocat/7", key));
    const again = keys.toReversed().map((key) => luckyCut("octocat/7", key));

    // Assert
    expect(again.toReversed()).toEqual(first);
    expect(new Set(first).size).toBeGreaterThan(1);
    for (const style of first) expect(WRAPPED_TRANSITIONS).toContain(style);
  });
});
