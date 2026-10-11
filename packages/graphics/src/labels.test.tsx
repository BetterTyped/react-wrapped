import { fireEvent, render, screen } from "@testing-library/react";

import { GraphicsGallery, type WrappedGraphic } from "./graphics-gallery";
import { InsightCard } from "./insight-card";
import { renderShareCard } from "./share-card";
import { DEFAULT_WRAPPED_CONFIG, PIXEL_ART, resolvePalette, WrappedProvider } from "@react-wrapped/core";

const palette = resolvePalette(DEFAULT_WRAPPED_CONFIG);

class NothingInView {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const badge = (id: string, extra: Partial<WrappedGraphic> = {}): WrappedGraphic => ({
  id,
  title: `Badge ${id}`,
  line: "A badge to pin.",
  image: `https://orbit.test/${id}.svg`,
  fileName: id,
  markdown: `![${id}](https://orbit.test/${id}.svg)`,
  ...extra,
});

const GRAPHICS = [badge("one"), badge("two"), badge("three", { locked: true }), badge("four", { locked: true })];

describe("the gallery's labels", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", NothingInView);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("says everything in English when no provider is on the page", () => {
    // Act
    render(<GraphicsGallery graphics={GRAPHICS} palette={palette} />);

    // Assert
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("2 graphics to keep.");
    expect(
      screen.getByText("Post them, pin them, put them in your README. 2 more unlock as the scan finds them."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Download" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Markdown" })[0]).toHaveAttribute(
      "title",
      "Copy the snippet that embeds it",
    );
    expect(screen.getAllByText("Still hidden")).toHaveLength(2);
    expect(screen.getAllByText("Scan your year to unlock it.")).toHaveLength(2);
  });

  it("takes its words from the provider and hands each sentence its number", () => {
    // Arrange
    const count = vi.fn<(count: number) => string>((open) => `Grafiki: ${open}`);
    const aboutLocked = vi.fn<(locked: number) => string>((locked) => `Jeszcze ${locked} do odkrycia.`);

    // Act
    render(
      <WrappedProvider
        labels={{
          gallery: {
            count,
            toKeep: "na zawsze.",
            aboutLocked,
            download: "Pobierz",
            markdown: "Kod",
            lockedTitle: "Wciąż ukryte",
          },
        }}
      >
        <GraphicsGallery graphics={GRAPHICS} palette={palette} />
      </WrappedProvider>,
    );

    // Assert
    expect(count).toHaveBeenCalledWith(2);
    expect(aboutLocked).toHaveBeenCalledWith(2);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Grafiki: 2 na zawsze.");
    expect(screen.getByText("Jeszcze 2 do odkrycia.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Pobierz" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Kod" })).toHaveLength(2);
    expect(screen.getAllByText("Wciąż ukryte")).toHaveLength(2);
    // What the provider did not name stays as it was.
    expect(screen.getAllByText("Scan your year to unlock it.")).toHaveLength(2);
  });

  it("says a snippet was copied the provider's way", () => {
    // Arrange
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(
      <WrappedProvider labels={{ gallery: { copied: "Skopiowano" } }}>
        <GraphicsGallery graphics={[badge("one")]} palette={palette} />
      </WrappedProvider>,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    // Assert
    expect(writeText).toHaveBeenCalledWith("![one](https://orbit.test/one.svg)");
    expect(screen.getByRole("button", { name: "Skopiowano" })).toBeInTheDocument();
  });
});

describe("the cards' labels", () => {
  const spec = {
    handle: "ada",
    caption: "Orbit Wrapped, 2026",
    name: "Marathon",
    rarity: "epic" as const,
    stat: { value: "41", label: "days in a row" },
    insight: "Your longest run.",
    chart: { type: "gauge" as const, share: 0.4 },
  };

  it("prints an insight card's rarity in English with no provider, and in the provider's word with one", () => {
    // Act
    const { container, rerender } = render(<InsightCard spec={spec} palette={palette} />);
    const plain = container.querySelector(".wr-insight-name span")?.textContent;
    rerender(
      <WrappedProvider labels={{ rarity: { epic: "Epicki" } }}>
        <InsightCard spec={spec} palette={palette} />
      </WrappedProvider>,
    );

    // Assert
    expect(plain).toBe("Epic");
    expect(container.querySelector(".wr-insight-name span")).toHaveTextContent("Epicki");
  });

  describe("renderShareCard", () => {
    /** Everything the card wrote, in order. jsdom has no canvas, so the card draws on one that only listens. */
    let written: string[] = [];

    beforeEach(() => {
      written = [];
      const context = new Proxy(
        { fillText: (text: string) => void written.push(text), measureText: () => ({ width: 0 }) },
        {
          get: (target, name) =>
            name in target
              ? target[name as keyof typeof target]
              : name === "createRadialGradient"
                ? () => ({ addColorStop: () => {} })
                : () => {},
          set: () => true,
        },
      );
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        context as unknown as CanvasRenderingContext2D,
      );
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((done) => done(new Blob(["png"])));
      Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      Reflect.deleteProperty(document, "fonts");
    });

    const card = {
      handle: "ada",
      avatarUrl: null,
      caption: "Orbit Wrapped",
      period: "2026",
      stats: [{ label: "Contributions", value: "1,107" }],
      tokens: [{ name: "Marathon", kind: "Achievement", rarity: "legendary" as const, art: PIXEL_ART.question }],
    };

    it("draws the rarity in English when it is handed no labels", async () => {
      // Act
      await renderShareCard(card, palette);

      // Assert
      expect(written).toContain("Legendary");
    });

    it("draws the rarity in the words it is handed", async () => {
      // Act
      await renderShareCard(card, palette, { labels: { rarity: { legendary: "Legendarny" } } });

      // Assert
      expect(written).toContain("Legendarny");
      expect(written).not.toContain("Legendary");
    });
  });
});
