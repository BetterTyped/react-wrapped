import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { LookProvider } from "../components/look";
import { DemoStage, Preview } from "../components/preview";
import { PART_IDS } from "../registry/parts";
import { DEMO_SCENE_KEYS } from "../registry/scenes";
import { PARTS } from "./index";

/*
 * The site is rendered to static HTML at build time, and a preview that throws on the server stops that build. So
 * every preview is rendered here the way the build does it: to a string, with no browser around.
 */

const onTheServer = (id: string) =>
  renderToString(createElement(LookProvider, null, createElement(Preview, { demo: { type: "part", id } })));

describe("the interactive previews", () => {
  it("has a component for every part a page can name", () => {
    // Assert
    expect(Object.keys(PARTS).toSorted()).toEqual([...PART_IDS].toSorted());
  });

  it.each(PART_IDS)("renders %s on the server, inside its own plate", (id) => {
    // Act
    const html = onTheServer(id);

    // Assert
    expect(html).toContain('class="d-part"');
    // The plate's own rules travel with it, written out as they stand.
    expect(html).toContain(".d-part button:not([class]):not(.wr-root *)");
    // Quotes included: in a style element an escaped quote is not a quote, and the rule would be dropped.
    expect(html).toContain('.d-part [role="group"]');
  });

  it("draws the library's own roots inside every part that shows one before the browser wakes up", () => {
    // Arrange: these draw only once they are in the browser (a canvas), or wait for storage to be read.
    const later = new Set(["share-card", "scan-first"]);

    // Act
    const bare = PART_IDS.filter((id) => !later.has(id) && !/wr-root|wr-stage|wr-insight/.test(onTheServer(id)));

    // Assert
    expect(bare).toEqual([]);
  });
});

describe("the scene previews", () => {
  it.each(DEMO_SCENE_KEYS)("renders %s on the server", (key) => {
    // Act
    const html = renderToString(
      createElement(LookProvider, null, createElement(DemoStage, { demo: { type: "scene", key } })),
    );

    // Assert
    expect(html).toContain("wr-scene");
  });

  it("draws the guide's own transitions between two scenes, cover and all", () => {
    // Act
    const html = renderToString(
      createElement(LookProvider, null, createElement(DemoStage, { demo: { type: "transition", id: "curtain" } })),
    );

    // Assert
    expect(html).toContain('data-cut="curtain"');
    expect(html).toContain("data-cut-custom");
  });
});
