import { fireEvent, render, screen } from "@testing-library/react";

import { type HiddenDrop, YEAR_SCAN_SLOTS, YearScan } from "./year-scan";
import { DEFAULT_WRAPPED_CONFIG, PIXEL_ART, resolvePalette, WrappedProvider } from "@react-wrapped/core";

class NothingInView {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const palette = resolvePalette(DEFAULT_WRAPPED_CONFIG);

const DROPS: readonly HiddenDrop[] = [
  {
    id: "streak",
    name: "Marathon",
    rarity: "rare",
    kind: "Achievement",
    line: "41 days in a row.",
    art: PIXEL_ART.question,
  },
  {
    id: "night",
    name: "Midnight Oil",
    rarity: "epic",
    kind: "Achievement",
    line: "Most of it after dark.",
    art: PIXEL_ART.question,
  },
];

function scan({
  found = [],
  className,
  classNames,
}: {
  found?: readonly string[];
  className?: string;
  classNames?: Parameters<typeof YearScan>[0]["classNames"];
} = {}) {
  return (
    <YearScan
      calendar={{ lead: 2, levels: Array.from({ length: 365 }, (_unused, day) => day % 5) }}
      palette={palette}
      drops={DROPS}
      found={found}
      onOpen={() => {}}
      describeDay={(day) => `Day ${day}`}
      className={className}
      classNames={classNames}
    />
  );
}

/** The element a slot names, which has to be on the page. */
function part(slot: string): Element {
  const element = document.querySelector(`[data-wr-slot="${slot}"]`);
  if (!element) throw new Error(`Nothing on the page is the slot "${slot}".`);
  return element;
}

describe("the scan's slots", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", NothingInView);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders every slot the scan names, across its states", () => {
    // Arrange: no state of the scan shows all of them at once, so each state adds the ones it shows.
    const seen = new Set<string>();
    const look = () => {
      for (const slot of YEAR_SCAN_SLOTS) if (document.querySelector(`[data-wr-slot="${slot}"]`)) seen.add(slot);
    };

    // Act: a scan with one find, the card of that find opened from its badge...
    const first = render(scan({ found: ["streak"] }));
    look();
    fireEvent.click(screen.getByRole("button", { name: /Marathon\s*Day \d+/ }));
    look();
    first.unmount();
    // ...a scan that is running...
    const second = render(scan());
    fireEvent.click(screen.getByRole("button", { name: "Scan my year" }));
    look();
    second.unmount();
    // ...and one that has found everything.
    render(scan({ found: ["streak", "night"] }));
    look();

    // Assert
    expect(YEAR_SCAN_SLOTS.filter((slot) => !seen.has(slot))).toEqual([]);
  });

  it("puts a class given for a slot after the library's own classes on that element", () => {
    // Act
    render(scan({ className: "my-panel", classNames: { "scan-start": "my-start", "scan-cell": "my-cell" } }));

    // Assert
    const start = screen.getByRole("button", { name: "Scan my year" });
    expect(start).toHaveAttribute("data-wr-slot", "scan-start");
    expect(start.className).toMatch(/^wr:inline-flex wr:h-11 .* wr:hover:-translate-y-px my-start$/);
    expect(part("scan").className).toMatch(/^wr-root wr:relative .* my-panel$/);
    // Every cell of the year is the same slot, and keeps the attributes the scan itself finds it by.
    const cells = document.querySelectorAll('[data-wr-slot="scan-cell"]');
    expect(cells).toHaveLength(367);
    for (const cell of cells) {
      expect(cell.className).toMatch(/ my-cell$/);
      expect(cell).toHaveAttribute("data-cell");
    }
    expect(part("scan-grid")).toHaveAttribute("data-scan-grid");
  });

  it("reaches the card it flies over the page, which is drawn outside the panel", () => {
    // Arrange
    const { container } = render(
      scan({ found: ["streak"], classNames: { "scan-card": "my-card", "scan-find": "my-badge" } }),
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /Marathon\s*Day \d+/ }));

    // Assert
    const card = part("scan-card");
    expect(card.className).toMatch(/^wr:absolute wr:inset-0 .* my-card$/);
    expect(container.contains(card)).toBe(false);
    expect(part("scan-card-name")).toHaveTextContent("Marathon");
    expect(part("scan-find")).toHaveAttribute("data-find-badge", "streak");
    expect(part("scan-find").className).toMatch(/ my-badge$/);
    expect(part("scan-backdrop")).toHaveAttribute("data-flight-backdrop");
  });

  it("takes a provider's class for a slot, and puts the scan's own after it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ "scan-start": "from-provider", "scan-headline": "headline-from-provider" }}>
        {scan({ classNames: { "scan-start": "from-prop" } })}
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Scan my year" }).className).toMatch(/ from-provider from-prop$/);
    expect(screen.getByText("Your year is hiding 2 scenes.").className).toMatch(/ headline-from-provider$/);
  });
});
