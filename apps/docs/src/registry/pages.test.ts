import { pageToMarkdown } from "../content/markdown";
import type { Block, Demo, DocPage } from "../content/types";
import { curtain, tilt } from "../demos/custom-transition";
import { fullTitle } from "../seo/head";
import { llmsTxt, sitemap, staticFiles } from "../static/files";
import { CHART_DOCS, CHART_EXAMPLES, CHART_TYPES } from "./charts";
import { PAGES, SECTIONS, titleOf } from "./pages";
import { isPart, PART_IDS } from "./parts";
import { demoScene, SCENE_DOCS, SCENE_IDS } from "./scenes";
import { TRANSITIONS } from "./transitions";
import { isTransition } from "@react-wrapped/core";
import * as scenesPackage from "@react-wrapped/scenes";

/** Words the house style bans, and the two dashes it bans with them. */
const BANNED =
  /\b(delve|leverage|utilize|harness|unleash|unlock|elevate|empower|robust|seamless|seamlessly|cutting-edge|game-changing|revolutionary|next-generation|tapestry|landscape|realm|journey|crafted|meticulously|comprehensive|holistic)\b/i;
const DASHES = /[–—]/;

/** Every piece of prose a page shows, code left out: code may say `format: "landscape"`, prose may not. */
function proseOfBlock(block: Block): string[] {
  switch (block.kind) {
    case "h2":
    case "h3":
    case "p":
    case "note":
      return [block.text];
    case "list":
    case "steps":
      return [...block.items];
    case "table":
      return [...block.head, ...block.rows.flat()];
    case "preview":
      return block.caption ? [block.caption] : [];
    case "faq":
      return block.items.flatMap((item) => [item.question, item.answer]);
    case "cards":
      return block.items.flatMap((item) => [item.title, item.text]);
    case "code":
      return [];
  }
}

function proseOf(page: DocPage): string[] {
  return [page.title, page.tagline ?? "", page.description, page.lead, ...page.blocks.flatMap(proseOfBlock)].map(
    (text) =>
      // What is inside backticks is code, wherever it stands.
      text.replaceAll(/`[^`]*`/g, ""),
  );
}

const repeated = (values: string[]) => values.filter((value, index) => values.indexOf(value) !== index);

/** Every text of a page that may carry a link: its lead and whatever its blocks say. */
function linkedTextOf(page: DocPage): string[] {
  return [
    page.lead,
    ...page.blocks.flatMap((block): string[] => {
      switch (block.kind) {
        case "table":
          return block.rows.flat();
        case "faq":
          return block.items.map((item) => item.answer);
        case "cards":
          return block.items.map((item) => `[${item.title}](${item.path}) ${item.text}`);
        case "list":
        case "steps":
          return [...block.items];
        case "preview":
          return block.caption ? [block.caption] : [];
        case "code":
          return [];
        default:
          return [block.text];
      }
    }),
  ];
}

/** Every preview a page shows, cards included. */
const demosOf = (page: DocPage): Demo[] =>
  page.blocks.flatMap((block) => {
    if (block.kind === "preview") return [block.demo];
    if (block.kind === "cards") return block.items.flatMap((item) => (item.demo ? [item.demo] : []));
    return [];
  });

const codeOf = (page: DocPage) => page.blocks.flatMap((block) => (block.kind === "code" ? [block.code] : []));

const titleIn = (page: DocPage) => fullTitle(page.tagline ? `${page.title}: ${page.tagline}` : page.title);

describe("docs pages", () => {
  it("gives every page a title a search result can show in full", () => {
    // Act
    const off = PAGES.map((page) => ({ path: page.path, title: titleIn(page), length: titleIn(page).length })).filter(
      (entry) => entry.length < 30 || entry.length > 65,
    );

    // Assert
    expect(off).toEqual([]);
  });

  it("gives every page a description of 50 to 170 characters", () => {
    // Act
    const off = PAGES.map((page) => ({ path: page.path, length: page.description.length })).filter(
      (entry) => entry.length < 50 || entry.length > 170,
    );

    // Assert
    expect(off).toEqual([]);
  });

  it("never repeats an address, a title or a description", () => {
    // Assert
    expect(repeated(PAGES.map((page) => page.path))).toEqual([]);
    expect(repeated(PAGES.map(titleIn))).toEqual([]);
    expect(repeated(PAGES.map((page) => page.description))).toEqual([]);
  });

  it("links every page to at least three others that exist", () => {
    // Act
    const thin = PAGES.filter((page) => page.related.filter((path) => path !== page.path && titleOf(path)).length < 3);
    const broken = PAGES.flatMap((page) =>
      page.related.filter((path) => !titleOf(path)).map((path) => [page.path, path]),
    );

    // Assert
    expect(thin.map((page) => page.path)).toEqual([]);
    expect(broken).toEqual([]);
  });

  it("links only to pages that exist from inside its text", () => {
    // Act
    const broken = PAGES.flatMap((page) =>
      linkedTextOf(page)
        .flatMap((text) => [...text.matchAll(/\]\((\/[^)#]*)/g)].map((match) => match[1]))
        .filter((path) => !titleOf(path))
        .map((path) => [page.path, path]),
    );

    // Assert
    expect(broken).toEqual([]);
  });

  it("keeps the house style: no long dashes and none of the banned words", () => {
    // Act
    const off = PAGES.flatMap((page) =>
      proseOf(page)
        .filter((text) => DASHES.test(text) || BANNED.test(text))
        .map((text) => [page.path, text]),
    );

    // Assert
    expect(off).toEqual([]);
  });

  it("keeps the long dashes out of the code it shows too", () => {
    // Act
    const off = PAGES.flatMap((page) =>
      codeOf(page)
        .filter((text) => DASHES.test(text))
        .map((text) => [page.path, text.slice(0, 80)]),
    );

    // Assert
    expect(off).toEqual([]);
  });

  it("never shows an empty block of code", () => {
    // Assert
    expect(PAGES.filter((page) => codeOf(page).some((text) => text.trim() === "")).map((page) => page.path)).toEqual(
      [],
    );
  });

  it("dates every page from its content", () => {
    // Assert
    expect(PAGES.filter((page) => !/^\d{4}-\d{2}-\d{2}$/.test(page.updated)).map((page) => page.path)).toEqual([]);
  });

  it("opens every page with a paragraph long enough to answer what it is", () => {
    // Assert
    expect(PAGES.filter((page) => page.lead.length < 120).map((page) => page.path)).toEqual([]);
  });
});

describe("the registries behind the pages", () => {
  it("has a page for every chart the library draws, led by an example of it", () => {
    // Assert
    expect([...CHART_TYPES].toSorted()).toEqual(Object.keys(CHART_DOCS).toSorted());
    for (const type of CHART_TYPES) {
      expect(PAGES.some((page) => page.path === `/docs/charts/${type}/`)).toBe(true);
    }
    // An example names itself on the designs page and in a demo, so two cannot share a name.
    expect(new Set(CHART_EXAMPLES.map((example) => example.name)).size).toBe(CHART_EXAMPLES.length);
  });

  it("has a page for every transition", () => {
    // Assert
    for (const transition of TRANSITIONS) {
      expect(PAGES.some((page) => page.path === `/docs/transitions/${transition.id}/`)).toBe(true);
    }
  });

  it("starts every section with a page that can stand as its overview", () => {
    // Assert
    expect(SECTIONS.filter((section) => section.pages.length === 0)).toEqual([]);
  });

  it("lays the sidebar out in the order someone learns the library in", () => {
    // Assert
    expect(SECTIONS.map((section) => section.title)).toEqual([
      "Get started",
      "Scenes",
      "Charts",
      "Transitions",
      "Player",
      "Scanner",
      "Graphics",
      "Marks",
      "Guides",
    ]);
    // Every page sits in the section it says it is in, or its breadcrumb would lie.
    for (const section of SECTIONS) {
      expect(section.pages.filter((page) => page.section !== section.id).map((page) => page.path)).toEqual([]);
    }
  });

  it("has a page for every scene the library exports, and documents no scene it does not", () => {
    // Arrange
    const exported = Object.keys(scenesPackage)
      .filter((name) => name.endsWith("Scene"))
      .toSorted();

    // Assert
    expect(SCENE_IDS.map((id) => SCENE_DOCS[id].fn).toSorted()).toEqual(exported);
    for (const id of SCENE_IDS) {
      expect(PAGES.some((page) => page.path === `/docs/scenes/${id}/`)).toBe(true);
    }
  });

  it("prints a scene's usage from the props its preview plays", () => {
    // Arrange
    const page = PAGES.find((candidate) => candidate.path === "/docs/scenes/summary/");
    const usage = page?.blocks.flatMap((block) =>
      block.kind === "code" && block.language === "tsx" ? [block.code] : [],
    );

    // Assert
    expect(usage?.[0]).toContain(`import { type CalendarLevels, PIXEL_ART } from "@react-wrapped/core";`);
    expect(usage?.[0]).toContain(`import { summaryScene } from "@react-wrapped/scenes";`);
    // The calendar and the art are named, not spelled out as 365 numbers and nine rows of dots.
    expect(usage?.[0]).toContain("    calendar,\n");
    expect(usage?.[0]).toContain("art: PIXEL_ART.mountain");
    expect(usage?.[0]).toContain(`{ key: "share-card", label: "Share card" },`);
  });

  it("says which texts of a scene a viewer can rewrite, from the scene itself", () => {
    // Assert
    expect(SCENE_DOCS.opening.example.fields.map((field) => field.name)).toEqual(["title", "period"]);
    // Placed locked on its page, the way a found drop is, yet the page still lists what its kind offers.
    expect(SCENE_DOCS.fact.example.scene.fields).toEqual([]);
    expect(SCENE_DOCS.fact.example.fields.map((field) => field.name)).toEqual(["stamp", "title", "description"]);
    expect(SCENE_DOCS.trophies.example.fields).toEqual([]);
  });

  it("can draw every preview a page asks for", () => {
    // Arrange: the guide's own transitions are registered by loading their file, as on the site.
    expect([curtain.id, tilt.id]).toEqual(["curtain", "tilt"]);
    const examples = new Set(CHART_EXAMPLES.map((example) => example.name));

    // Act
    const missing = PAGES.flatMap((page) =>
      demosOf(page)
        .filter((demo) => {
          if (demo.type === "chart") return !examples.has(demo.example);
          if (demo.type === "transition") return !isTransition(demo.id);
          if (demo.type === "scene") return !demoScene(demo.key);
          return !isPart(demo.id);
        })
        .map((demo) => [page.path, demo]),
    );

    // Assert
    expect(missing).toEqual([]);
  });

  it("shows every interactive part on at least one page", () => {
    // Act
    const shown = new Set(PAGES.flatMap(demosOf).flatMap((demo) => (demo.type === "part" ? [demo.id] : [])));

    // Assert
    expect(PART_IDS.filter((id) => !shown.has(id))).toEqual([]);
  });

  it("leads every page about a thing you can see with a preview of it", () => {
    // Arrange: the sections whose pages are each about one visible thing.
    const visual = PAGES.filter(
      (page) =>
        ["scenes", "player", "scanner", "graphics", "marks"].includes(page.section) ||
        page.path === "/docs/first-wrapped/",
    );

    // Assert
    expect(visual.filter((page) => demosOf(page).length === 0).map((page) => page.path)).toEqual([]);
  });
});

describe("the files beside the pages", () => {
  it("lists every page once in the sitemap, by its full address", () => {
    // Act
    const listed = [...sitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    // Assert
    expect(listed).toHaveLength(PAGES.length + 4);
    expect(listed).toContain("https://bettertyped.github.io/react-wrapped/examples/from-parts/");
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.every((address) => address.startsWith("https://bettertyped.github.io/react-wrapped/"))).toBe(true);
    expect(listed.some((address) => address.includes("/404"))).toBe(false);
  });

  it("gives every page a Markdown twin and points llms.txt at each of them", () => {
    // Act
    const files = staticFiles();
    const text = llmsTxt();

    // Assert
    for (const page of PAGES) {
      expect(files.some((file) => file.path === `${page.path.slice(1)}index.md`)).toBe(true);
      expect(text).toContain(`${page.path}index.md`);
    }
  });

  it("writes a twin a reader can follow without the site: full links, the code, the props", () => {
    // Arrange
    const spark = PAGES.find((page) => page.path === "/docs/charts/spark/");

    // Act
    const markdown = spark ? pageToMarkdown(spark, titleOf) : "";

    // Assert
    expect(markdown).toMatch(/^# Spark chart\n/);
    expect(markdown).toContain("```tsx");
    expect(markdown).toContain("| `values` |");
    expect(markdown).not.toMatch(/\]\(\//);
    expect(markdown).toContain("](https://bettertyped.github.io/react-wrapped/docs/charts/)");
  });

  it("tells a text reader where an interactive part can be tried, and still gives them its code", () => {
    // Arrange
    const page = PAGES.find((candidate) => candidate.path === "/docs/player/wrapped-player/");

    // Act
    const markdown = page ? pageToMarkdown(page, titleOf) : "";

    // Assert
    expect(markdown).toContain(
      "> Live preview: try it at https://bettertyped.github.io/react-wrapped/docs/player/wrapped-player/",
    );
    expect(markdown).toContain("`player-remote.tsx`");
    expect(markdown).toContain(`import { WrappedPlayer, type WrappedPlayerHandle } from "@react-wrapped/player";`);
    expect(markdown).toContain("| `ref?` |");
  });
});
