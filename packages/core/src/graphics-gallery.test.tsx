import { render, screen } from "@testing-library/react";

import { DEFAULT_WRAPPED_CONFIG } from "./config";
import { GraphicsGallery, type WrappedGraphic } from "./graphics-gallery";
import { resolvePalette } from "./palettes";

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

const card = (extra: Partial<WrappedGraphic>): WrappedGraphic => ({
  id: "always-on",
  title: "Always On",
  line: "One pill for every week of your year.",
  image: vi.fn<() => Promise<Blob>>(async () => new Blob(["png"], { type: "image/png" })),
  fileName: "always-on",
  wide: true,
  ...extra,
});

describe("GraphicsGallery", () => {
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

  it("draws a card that was locked when the page opened, once the scan unlocks it", async () => {
    // Arrange: the gallery opens before the scan has found this achievement.
    const image = vi.fn<() => Promise<Blob>>(async () => new Blob(["png"], { type: "image/png" }));
    const { rerender } = render(<GraphicsGallery graphics={[card({ image, locked: true })]} palette={palette} />);
    expect(screen.getByText("Still hidden")).toBeInTheDocument();

    // Act: the scan finds it.
    rerender(<GraphicsGallery graphics={[card({ image, locked: false })]} palette={palette} />);

    // Assert: the card is drawn, not left as a pulsing dot.
    expect(await screen.findByRole("img", { name: "Always On" })).toHaveAttribute("src", "blob:card");
    expect(image).toHaveBeenCalledTimes(1);
  });

  it("does not draw a card while it is still locked", () => {
    // Arrange
    const image = vi.fn<() => Promise<Blob>>(async () => new Blob(["png"], { type: "image/png" }));

    // Act
    render(<GraphicsGallery graphics={[card({ image, locked: true })]} palette={palette} />);

    // Assert
    expect(image).not.toHaveBeenCalled();
  });
});
