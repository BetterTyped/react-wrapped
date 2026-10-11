import { expect, type Page, test } from "@playwright/test";

import { BASE, libraryStylesheetAddress, stylesOf } from "./helpers";

/*
 * What the styling guide says about who wins, checked in a real browser. The library's stylesheet is plain CSS
 * outside any cascade layer, and Tailwind v4 keeps its utilities in `@layer utilities`. A layered rule loses to an
 * unlayered one, so a utility loses to the library's own class until the library's stylesheet is imported into a
 * layer that comes before utilities. Each page here is built by hand: one library button and a few lines of CSS.
 */

const RED = "rgb(255, 0, 0)";
const BLUE = "rgb(0, 0, 255)";
const CLEAR = "rgba(0, 0, 0, 0)";

/** What Tailwind compiles `bg-red-500` to, as far as the cascade cares: one class, in the utilities layer. */
const UTILITY = `@layer utilities { .tw-red { background-color: ${RED} } }`;

/**
 * A blank page of the site's own origin with one button of the library's on it: inside a root of the library's,
 * wearing two of its own utility classes and whatever a host adds.
 */
const pageWith = ({ head, added }: { head: string; added: string }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Layers</title>
    ${head}
  </head>
  <body>
    <div class="wr-root">
      <button type="button" id="probe" data-wr-slot="player-play" class="wr:rounded-full wr:bg-foreground ${added}">
        x
      </button>
    </div>
  </body>
</html>`;

/** Serves a hand-built page from the site's origin, opens it, and reads the button's background and corners. */
async function probe(page: Page, name: string, html: string) {
  const address = `${BASE}__layers/${name}.html`;
  await page.route(`**${address}`, (route) => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto(address);
  const button = page.locator("#probe");
  // The library's stylesheet is in effect once the button has the round corners only it gives.
  await expect
    .poll(async () => (await stylesOf(button, ["border-top-left-radius"]))["border-top-left-radius"], {
      message: "the library's stylesheet is loaded and styles the button",
    })
    .not.toBe("0px");
  return stylesOf(button, ["background-color", "border-top-left-radius"]);
}

test.describe("a Tailwind utility on a library element", () => {
  test("loses to the library's own class while the library's stylesheet is loaded plainly", async ({ page }) => {
    // Arrange: the library's stylesheet as a plain link, and the utility in its layer after it.
    const stylesheet = libraryStylesheetAddress();
    const html = pageWith({
      head: `<link rel="stylesheet" href="${stylesheet}" /><style>${UTILITY}</style>`,
      added: "tw-red",
    });

    // Act
    const styles = await probe(page, "plain", html);

    // Assert: the button keeps the library's foreground colour.
    expect(styles["background-color"]).not.toBe(RED);
    expect(styles["background-color"]).not.toBe(CLEAR);
  });

  test("wins once the library's stylesheet is imported into a layer before utilities", async ({ page }) => {
    // Arrange: the same rules, with the library's stylesheet in `components`. The order of the layers is said
    // first, in a statement, because nothing but that may stand before an import.
    const stylesheet = libraryStylesheetAddress();
    const html = pageWith({
      head: `<style>@layer components, utilities; @import url("${stylesheet}") layer(components); ${UTILITY}</style>`,
      added: "tw-red",
    });

    // Act
    const styles = await probe(page, "layered", html);

    // Assert: the utility has the background, and the library still has everything the utility did not name.
    expect(styles["background-color"]).toBe(RED);
    expect(styles["border-top-left-radius"]).not.toBe("0px");
  });
});

test.describe("a plain class on a library element", () => {
  test("wins over the library's class when its stylesheet comes after the library's", async ({ page }) => {
    // Arrange
    const stylesheet = libraryStylesheetAddress();
    const html = pageWith({
      head: `<link rel="stylesheet" href="${stylesheet}" /><style>.mine { background-color: ${BLUE} }</style>`,
      added: "mine",
    });

    // Act
    const styles = await probe(page, "later", html);

    // Assert
    expect(styles["background-color"]).toBe(BLUE);
  });

  test("loses when its stylesheet comes first, unless the selector names the slot too", async ({ page }) => {
    // Arrange: two pages with the host's rule before the library's stylesheet. One is a bare class, the other
    // has the slot's attribute in it as well.
    const stylesheet = libraryStylesheetAddress();
    const early = (rule: string) =>
      pageWith({ head: `<style>${rule}</style><link rel="stylesheet" href="${stylesheet}" />`, added: "mine" });

    // Act
    const bare = await probe(page, "early-bare", early(`.mine { background-color: ${BLUE} }`));
    const slotted = await probe(
      page,
      "early-slotted",
      early(`.mine[data-wr-slot="player-play"] { background-color: ${BLUE} }`),
    );

    // Assert
    expect(bare["background-color"]).not.toBe(BLUE);
    expect(slotted["background-color"]).toBe(BLUE);
  });
});
