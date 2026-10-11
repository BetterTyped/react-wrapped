import { fireEvent, render, screen } from "@testing-library/react";

import { type HiddenDrop, YearScan } from "./year-scan";
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
  {
    id: "moon",
    name: "Full Moon",
    rarity: "common",
    kind: "Easter egg",
    line: "Once a month.",
    art: PIXEL_ART.question,
  },
];

function scan({ found = [], gate = false }: { found?: readonly string[]; gate?: boolean } = {}) {
  return (
    <YearScan
      calendar={{ lead: 2, levels: Array.from({ length: 365 }, (_unused, day) => day % 5) }}
      palette={palette}
      drops={DROPS}
      found={found}
      onOpen={() => {}}
      describeDay={(day) => `Day ${day}`}
      gate={gate}
    />
  );
}

describe("the scan's labels", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", NothingInView);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("says everything in English when no provider is on the page", () => {
    // Act
    render(scan());

    // Assert
    expect(screen.getByText("Your year is hiding 3 scenes.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Achievements you earned and a few easter eggs. Each one joins your video when the scan finds it.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan my year" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Your finds" })).toBeInTheDocument();
    expect(screen.getAllByText("Still hidden")).toHaveLength(3);
  });

  it("takes its words from the provider and hands each sentence its number", () => {
    // Arrange
    const hiding = vi.fn<(count: number) => string>((count) => `Ukryte sceny: ${count}`);

    // Act
    render(
      <WrappedProvider
        labels={{ scan: { hiding, start: "Skanuj mój rok", finds: "Znaleziska", stillHidden: "Wciąż ukryte" } }}
      >
        {scan()}
      </WrappedProvider>,
    );

    // Assert
    expect(hiding).toHaveBeenCalledWith(3);
    expect(screen.getByText("Ukryte sceny: 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skanuj mój rok" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Znaleziska" })).toBeInTheDocument();
    expect(screen.getAllByText("Wciąż ukryte")).toHaveLength(3);
    expect(screen.queryByText("Your year is hiding 3 scenes.")).toBeNull();
  });

  it("rewords the page it is before the first scan, and the scan once it runs", () => {
    // Arrange
    const scanning = vi.fn<(left: number) => string>((left) => `Skanuję. Zostało: ${left}`);

    // Act
    render(
      <WrappedProvider
        labels={{
          scan: {
            almostReady: "Prawie gotowe.",
            aboutWaiting: (count) => `Znajdź ${count}, a film ruszy.`,
            startGate: "Znajdź moje sceny",
            findAll: "Znajdź wszystkie",
            scanning,
          },
        }}
      >
        {scan({ gate: true })}
      </WrappedProvider>,
    );
    const waiting = [screen.getByText("Prawie gotowe."), screen.getByText("Znajdź 3, a film ruszy.")];
    fireEvent.click(screen.getByRole("button", { name: "Znajdź moje sceny" }));

    // Assert
    expect(waiting).toHaveLength(2);
    expect(scanning).toHaveBeenCalledWith(2);
    expect(screen.getByText("Skanuję. Zostało: 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Znajdź wszystkie" })).toBeInTheDocument();
  });

  it("says what is left and names a found tile the provider's way", () => {
    // Act
    render(
      <WrappedProvider
        labels={{
          scan: {
            moreHiding: (count) => `Jeszcze ${count}.`,
            resume: "Skanuj dalej",
            open: (name) => `Otwórz ${name}`,
            openCard: "Otwórz kartę",
          },
        }}
      >
        {scan({ found: ["streak"] })}
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByText("Jeszcze 2.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skanuj dalej" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Otwórz Marathon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Marathon\s*Day \d+/ })).toHaveAttribute("title", "Otwórz kartę");
  });
});
