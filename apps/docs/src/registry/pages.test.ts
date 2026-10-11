import { pageToMarkdown } from "../content/markdown";
import type { Block, DocPage } from "../content/types";
import { fullTitle } from "../seo/head";
import { llmsTxt, sitemap, staticFiles } from "../static/files";
import { CHART_DOCS, CHART_EXAMPLES, CHART_TYPES } from "./charts";
import { PAGES, SECTIONS, titleOf } from "./pages";
import { TRANSITIONS } from "./transitions";

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
      [
        page.lead,
        ...page.blocks.flatMap((block) =>
          "text" in block ? [block.text] : "items" in block ? block.items.map(String) : [],
        ),
      ]
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
});

describe("the files beside the pages", () => {
  it("lists every page once in the sitemap, by its full address", () => {
    // Act
    const listed = [...sitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    // Assert
    expect(listed).toHaveLength(PAGES.length + 3);
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
});
