import { render, screen } from "@testing-library/react";

import { GRAPHICS_GALLERY_SLOTS, GraphicsGallery, type WrappedGraphic } from "./graphics-gallery";
import { DEFAULT_WRAPPED_CONFIG, resolvePalette, WrappedProvider } from "@react-wrapped/core";

const palette = resolvePalette(DEFAULT_WRAPPED_CONFIG);

/** A viewport that everything is already inside: every observed tile is reported as on screen at once. */
class EverythingOnScreen {
  constructor(private readonly report: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.report(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

const drawn = async () => new Blob(["png"], { type: "image/png" });

/** One tile of every kind: drawn, hot-linked with a snippet, still being drawn, failed, and locked. */
const GRAPHICS: readonly WrappedGraphic[] = [
  { id: "card", title: "Always On", line: "One pill for every week.", image: drawn, fileName: "card", wide: true },
  {
    id: "badge",
    title: "Night Owl",
    line: "A badge for your README.",
    image: "https://orbit.example/ada/night-owl.svg",
    fileName: "night-owl",
    markdown: "![Night Owl](https://orbit.example/ada/night-owl.svg)",
  },
  // Never finishes: its tile keeps the dot that waits for a picture.
  { id: "slow", title: "Slow", line: "Still drawing.", image: () => new Promise<Blob>(() => {}), fileName: "slow" },
  {
    id: "broken",
    title: "Broken",
    line: "Did not come through.",
    image: async () => {
      throw new Error("The picture could not be drawn.");
    },
    fileName: "broken",
  },
  { id: "hidden", title: "Hidden", line: "Not found yet.", image: drawn, fileName: "hidden", locked: true },
];

/** Tiles that are all there the moment they render: two hot-linked pictures and a locked one. Nothing to wait for. */
const SETTLED = GRAPHICS.filter((graphic) => typeof graphic.image === "string" || graphic.locked).concat({
  id: "second",
  title: "Early Bird",
  line: "Another badge.",
  image: "https://orbit.example/ada/early-bird.svg",
  fileName: "early-bird",
});

/** The element a slot names, which has to be on the page. */
function part(slot: string): Element {
  const element = document.querySelector(`[data-wr-slot="${slot}"]`);
  if (!element) throw new Error(`Nothing on the page is the slot "${slot}".`);
  return element;
}

describe("the gallery's slots", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", EverythingOnScreen);
    // jsdom has no object URLs; the tile only needs something to put in the image's src.
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:card");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders every slot the gallery names, with a tile of every kind on the page", async () => {
    // Act
    render(<GraphicsGallery graphics={GRAPHICS} palette={palette} />);
    await screen.findByRole("img", { name: "Always On" });
    await screen.findByRole("alert");

    // Assert
    expect(GRAPHICS_GALLERY_SLOTS.filter((slot) => !document.querySelector(`[data-wr-slot="${slot}"]`))).toEqual([]);
  });

  it("puts a class given for a slot after the library's own classes on that element", () => {
    // Act
    render(
      <GraphicsGallery
        graphics={SETTLED}
        palette={palette}
        className="my-gallery"
        classNames={{ "gallery-tile": "my-tile", "gallery-download": "my-download", "gallery-locked": "my-locked" }}
      />,
    );

    // Assert
    expect(part("gallery").className).toBe("wr-root wr:pt-10 wr:md:pt-14 my-gallery");
    const tiles = document.querySelectorAll('[data-wr-slot="gallery-tile"]');
    expect(tiles).toHaveLength(2);
    for (const tile of tiles) expect(tile.className).toMatch(/^wr:group\/tile .* my-tile$/);
    for (const button of screen.getAllByRole("button", { name: "Download" })) {
      expect(button.className).toMatch(/^wr:inline-flex wr:h-10 .* my-download$/);
    }
    // A locked tile is its own slot: it takes its own class and not the open tiles'.
    expect(part("gallery-locked").className).toMatch(/ my-locked$/);
    expect(part("gallery-locked").className).not.toMatch(/my-tile/);
  });

  it("takes a provider's class for a slot, and puts the gallery's own after it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ "gallery-markdown": "from-provider", "gallery-heading": "heading-from-provider" }}>
        <GraphicsGallery graphics={SETTLED} palette={palette} classNames={{ "gallery-markdown": "from-prop" }} />
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Markdown" }).className).toMatch(/ from-provider from-prop$/);
    expect(screen.getByRole("heading", { level: 3 }).className).toMatch(/ heading-from-provider$/);
  });
});
