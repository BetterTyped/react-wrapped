import { expect, type Locator, type Page, test } from "@playwright/test";

import { at, BASE, player, stylesOf } from "./helpers";

/* oxlint-disable no-await-in-loop -- a handful of readings from one page, in order */

/*
 * The "hostile host" check. The library is dropped into other people's pages, so it must look the same whatever
 * their stylesheet says about buttons and headings, and it must leave their buttons and headings alone.
 */

/** What a careless global stylesheet does to the tags the library also uses. */
const HOSTILE_CSS = `
  button{border:3px solid red;background:yellow;padding:20px;font-family:serif}
  h2,h3,p{margin:40px;font-family:serif}
  ul{list-style:disc;padding-left:40px}
  svg{display:inline}
  *{box-sizing:content-box}
`;

const SIDES = ["top", "right", "bottom", "left"] as const;

const BORDERS = SIDES.map((side) => `border-${side}-width`);
const PADDINGS = SIDES.map((side) => `padding-${side}`);
const MARGINS = SIDES.map((side) => `margin-${side}`);

/** What has to stay the same on a library element when the host's stylesheet turns hostile. */
const GUARDED = [...BORDERS, ...PADDINGS, ...MARGINS, "box-sizing", "background-color", "font-family"];

/**
 * Library elements of every kind the hostile rules aim at: controls, chips, pills, scene text, calendar cells.
 *
 * `hostWins` lists properties the hostile stylesheet still takes over, each a known limitation and never hidden. It
 * is empty today. The library's reset (packages/core/src/reset.css) names its roots inside `:where()` and follows
 * each element with four `:not()` of tags it can never be, so a rule there weighs more than a host's `button{...}`,
 * `h2,h3,p{...}` or `*{...}` and still less than any class. What it cannot outrank is a host rule with a class in
 * it, such as `.prose h2{...}`: that is not tested here because it is not something the library can win.
 */
const LIBRARY_ELEMENTS = [
  {
    name: "the play and pause button",
    find: (page: Page) =>
      page.getByRole("toolbar", { name: /Video controls/ }).getByRole("button", { name: "Play", exact: true }),
    hostWins: [],
  },
  {
    name: "a settings chip",
    find: (page: Page) => page.getByRole("radiogroup", { name: "Format" }).getByRole("radio", { name: "1:1" }),
    hostWins: [],
  },
  {
    name: 'the "Copy link" button',
    find: (page: Page) => page.locator(".wr-root").getByRole("button", { name: "Copy link" }),
    hostWins: [],
  },
  {
    name: "a scene title",
    find: (page: Page) => page.locator(".wr-stage:not(.wr-thumb) .wr-scene h2.wr-title"),
    hostWins: [],
  },
  {
    name: "a calendar cell",
    find: (page: Page) => page.locator(".wr-stage:not(.wr-thumb) .wr-cell"),
    hostWins: [],
  },
] satisfies readonly { name: string; find: (page: Page) => Locator; hostWins: readonly string[] }[];

/**
 * Opens the full example and holds its video still, so nothing but the injected stylesheet can change a computed
 * style between two readings.
 */
async function openStillExample(page: Page) {
  await page.goto(at("/examples/full-wrapped/"));
  await player.ready(page);
  await player.seek(page, 1);
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
}

/** The property values that differ between two readings, as "name: before -> after". */
const changed = (before: Record<string, string>, after: Record<string, string>): string[] =>
  Object.keys(before)
    .filter((name) => before[name] !== after[name])
    .map((name) => `${name}: ${before[name]} -> ${after[name]}`);

/** Reads the named properties of an element, turns the host hostile, and says which of them changed. */
async function changedByHostileHost(
  page: Page,
  find: (page: Page) => Locator,
  properties: readonly string[],
): Promise<string[]> {
  await openStillExample(page);
  const element = find(page);
  await expect(element.first(), "the element is on the page").toBeAttached();
  const before = await stylesOf(element, properties);
  await page.addStyleTag({ content: HOSTILE_CSS });
  const after = await stylesOf(element, properties);
  return changed(before, after);
}

test.describe("a host page with an aggressive stylesheet", () => {
  for (const element of LIBRARY_ELEMENTS) {
    const lost: readonly string[] = element.hostWins;
    const held = GUARDED.filter((property) => !lost.includes(property));

    test(`${element.name} keeps its ${held.join(", ")}`, async ({ page }) => {
      // Act
      const differences = await changedByHostileHost(page, element.find, held);

      // Assert
      expect(differences, `${element.name} changed`).toEqual([]);
    });

    // Anything listed in `hostWins` is a property the host's rules still take over: whole and waiting, not hidden.
    if (lost.length === 0) continue;
    test.fixme(`${element.name} keeps its ${lost.join(", ")} (the host's rules win today)`, async ({ page }) => {
      // Act
      const differences = await changedByHostileHost(page, element.find, lost);

      // Assert
      expect(differences, `${element.name} changed`).toEqual([]);
    });
  }
});

/** A page of the same origin with a few plain elements on it and, when asked, the library's stylesheet. */
const plainPage = (stylesheet: string | null) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Plain page</title>
    ${stylesheet ? `<link rel="stylesheet" href="${stylesheet}" />` : ""}
  </head>
  <body>
    <button type="button" id="plain-button">A button</button>
    <h2 id="plain-heading">A heading</h2>
    <p id="plain-paragraph">A paragraph of plain text.</p>
    <ul id="plain-list"><li id="plain-item">An item</li></ul>
  </body>
</html>`;

const PLAIN = ["#plain-button", "#plain-heading", "#plain-paragraph", "#plain-list", "#plain-item"] as const;

/** Every computed property of an element that is about its box, its type or its colours. */
const hostStyles = (page: Page, selector: string) =>
  page.evaluate((target) => {
    const node = document.querySelector(target);
    if (!node) throw new Error(`Nothing on the page matches ${target}`);
    const computed = getComputedStyle(node);
    const watched = /^(margin|padding|border|font|list-style|background)(-|$)|^(display|box-sizing|color)$/;
    const values: Record<string, string> = {};
    for (const name of computed) {
      if (watched.test(name)) values[name] = computed.getPropertyValue(name);
    }
    return values;
  }, selector);

test.describe("the library's stylesheet on a plain page", () => {
  /** The address of the library's stylesheet: the one linked from the example whose rules style `.wr-stage`. */
  async function libraryStylesheet(page: Page): Promise<string> {
    await page.goto(at("/examples/full-wrapped/"));
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((link) => link.href),
    );
    for (const href of hrefs) {
      const response = await page.request.get(href);
      if (response.ok() && (await response.text()).includes(".wr-stage")) return href;
    }
    throw new Error(`None of the example's stylesheets has a .wr-stage rule: ${hrefs.join(", ")}`);
  }

  test("leaves the host's own button, heading, paragraph and list exactly as the browser draws them", async ({
    page,
  }) => {
    // Arrange: two blank pages of the site's origin, one with the library's stylesheet and one with none.
    const stylesheet = await libraryStylesheet(page);
    await page.route(`**${BASE}__plain/with-library.html`, (route) =>
      route.fulfill({ contentType: "text/html", body: plainPage(stylesheet) }),
    );
    await page.route(`**${BASE}__plain/bare.html`, (route) =>
      route.fulfill({ contentType: "text/html", body: plainPage(null) }),
    );

    // Act
    await page.goto(`${BASE}__plain/bare.html`);
    const bare = new Map<string, Record<string, string>>();
    for (const selector of PLAIN) bare.set(selector, await hostStyles(page, selector));

    await page.goto(`${BASE}__plain/with-library.html`);
    await expect
      .poll(() => page.evaluate(() => document.styleSheets.length), { message: "the library's stylesheet is loaded" })
      .toBe(1);
    const restyled: string[] = [];
    for (const selector of PLAIN) {
      const differences = changed(bare.get(selector) ?? {}, await hostStyles(page, selector));
      restyled.push(...differences.map((difference) => `${selector} ${difference}`));
    }

    // Assert
    expect(Object.keys(bare.get("#plain-button") ?? {}).length, "properties compared per element").toBeGreaterThan(40);
    expect(restyled).toEqual([]);
  });
});
