import { expect, type Page, test } from "@playwright/test";

import { at, hydrated, oneChartPage, oneTransitionPage, watchErrors } from "./helpers";

/*
 * The site's own chrome: the bar, the docs drawer, dark mode, and the one rule every page has to keep at every
 * width, which is that nothing makes it scroll sideways.
 */

const PAGES = [
  at("/"),
  at("/docs/"),
  oneChartPage().path,
  oneTransitionPage().path,
  at("/designs/"),
  at("/examples/full-wrapped/"),
];

const WIDTHS = [1440, 768, 390] as const;

const THEME_KEY = "react-wrapped:docs:theme";

/** How far the page can scroll sideways, and which elements reach past its right edge when it can. */
function sidewaysOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const wide = root.scrollWidth > window.innerWidth;
    const reaching = wide
      ? [...document.querySelectorAll("body *")]
          .filter((node) => node.getBoundingClientRect().right > window.innerWidth + 0.5)
          .slice(0, 5)
          .map((node) => {
            const classes = (node.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 3);
            return `${[node.tagName.toLowerCase(), ...classes].join(".")} ends at ${Math.round(node.getBoundingClientRect().right)} px`;
          })
      : [];
    return { scrollWidth: root.scrollWidth, innerWidth: window.innerWidth, reaching };
  });
}

/**
 * Widths at which the site scrolls sideways today, each with what is too wide. The tests of a width listed here
 * are `test.fixme`: whole and waiting, and they run again the day the entry is deleted.
 */
const KNOWN_SIDEWAYS: Partial<Record<(typeof WIDTHS)[number], string>> = {};

/** Opens a page and checks it is no wider than the window. */
async function fitsTheWindow(page: Page, path: string) {
  // Act
  await page.goto(path);
  await hydrated(page, ".d-bar");
  await page.evaluate(() => document.fonts.ready);
  const measured = await sidewaysOverflow(page);

  // Assert
  expect(
    measured.scrollWidth,
    `the page is ${measured.scrollWidth} px wide in a ${measured.innerWidth} px window. Past the edge: ${measured.reaching.join("; ")}`,
  ).toBeLessThanOrEqual(measured.innerWidth);
}

for (const width of WIDTHS) {
  test.describe(`at ${width} px wide`, () => {
    test.use({ viewport: { width, height: 900 } });

    const known = KNOWN_SIDEWAYS[width];
    for (const path of PAGES) {
      const title = `${path} does not scroll sideways`;
      if (known) test.fixme(`${title}. Known: ${known}`, ({ page }) => fitsTheWindow(page, path));
      else test(title, ({ page }) => fitsTheWindow(page, path));
    }
  });
}

test.describe("every kind of page", () => {
  for (const path of PAGES) {
    test(`${path} opens without a console error or an uncaught exception`, async ({ page }) => {
      // Arrange
      const errors = watchErrors(page);

      // Act
      await page.goto(path);
      await hydrated(page, ".d-bar");
      // Long enough for the previews to start playing and say so if they cannot.
      await page.waitForTimeout(1500);

      // Assert
      expect(errors).toEqual([]);
    });
  }
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu button opens the docs drawer and a link in it goes to that page", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/"));
    await hydrated(page, ".d-bar");

    // Act
    await page.getByRole("button", { name: "Open the docs menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Docs menu" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Installation", exact: true }).click();

    // Assert
    await expect(page).toHaveURL(new RegExp(`${at("/docs/installation/")}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/install/i);
    await expect(drawer).toBeHidden();
  });
});

test.describe("the bar", () => {
  test("the site opens dark, and the theme toggle's choice survives a reload", async ({ page }) => {
    // Arrange: even a browser that asks for light gets the night page until the reader says otherwise.
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(at("/docs/"));
    await hydrated(page, ".d-bar");
    const html = page.locator("html");
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);

    // Act
    await page.getByRole("button", { name: "Use light mode" }).click();

    // Assert
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe("light");

    // Act: the same page again, and then back to dark.
    await page.reload();
    await hydrated(page, ".d-bar");

    // Assert
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
    await page.getByRole("button", { name: "Use dark mode" }).click();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe("dark");
    await page.reload();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  });

  test("picking a palette repaints the site, and a reload keeps it", async ({ page }) => {
    // Arrange
    await page.goto(oneChartPage().path);
    await hydrated(page, ".d-look");
    const light = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--d-g2"));
    const before = await light();

    // Act
    await page.getByRole("button", { name: "Grape" }).first().click();

    // Assert: the page's own light is the palette's, not only the stage's. The colour fades to the new one, so it
    // is read once it has stopped moving.
    await expect
      .poll(async () => {
        const first = await light();
        await page.waitForTimeout(200);
        return first !== before && first === (await light());
      })
      .toBe(true);
    const picked = await light();

    // Act
    await page.reload();

    // Assert: there before React runs, so the page never flashes the default.
    expect(await light()).toBe(picked);
  });

  test("Spin runs the reel and opens the page it lands on", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/"));
    await hydrated(page, ".d-bar");

    // Act
    await page.getByRole("button", { name: "Spin: open a random page" }).click();
    const reel = page.getByRole("dialog", { name: "Spin: a random page" });
    await expect(reel).toBeVisible();
    const open = reel.getByRole("button", { name: "Open it" });
    await expect(open).toBeEnabled({ timeout: 10_000 });
    const won = (await reel.locator(".d-spin-won strong").innerText()).replaceAll(/\s+/g, " ").trim();
    await open.click();

    // Assert: a chart, a scene or a transition, and the page is the one the reel named.
    await expect(page).toHaveURL(/\/docs\/(charts|scenes|transitions)\/[a-z-]+\/$/);
    await expect(reel).toBeHidden();
    const [name] = won.split(" ");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
  });

  test("a reel left alone opens its page by itself", async ({ page }) => {
    // Arrange
    await page.goto(at("/docs/"));
    await hydrated(page, ".d-bar");

    // Act
    await page.getByRole("button", { name: "Spin: open a random page" }).click();

    // Assert
    await expect(page).toHaveURL(/\/docs\/(charts|scenes|transitions)\/[a-z-]+\/$/, { timeout: 15_000 });
  });

  test("the Hype Stack link says where the visitor came from", async ({ page }) => {
    // Act
    await page.goto(at("/"));
    const link = page.locator("header").getByRole("link", { name: "Hype Stack" });

    // Assert
    await expect(link).toHaveCount(1);
    const href = (await link.getAttribute("href")) ?? "";
    expect(href.startsWith("https://www.hype-stack.dev/"), `href is ${href}`).toBe(true);
    expect(href).toContain("utm_source=react-wrapped");
  });
});
