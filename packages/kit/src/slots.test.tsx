import { fireEvent, render, screen } from "@testing-library/react";
import { gsap } from "gsap";

import { WRAPPED_VIEW_SLOTS, WrappedView } from "./wrapped-view";
import { DEFAULT_WRAPPED_CONFIG, PIXEL_ART, type SceneInstance, WrappedProvider } from "@react-wrapped/core";
import type { WrappedGraphic } from "@react-wrapped/graphics";
import type { HiddenDrop } from "@react-wrapped/scan";

class NoResizes {
  observe() {}
  disconnect() {}
  unobserve() {}
}

/** A scene that takes three seconds, which is all the timeline needs to know about it. */
function scene(key: string, fields: SceneInstance["fields"] = []): SceneInstance {
  const instance: SceneInstance = {
    key,
    label: key,
    fields,
    withEdits: () => instance,
    content: (
      <section className="wr-scene" data-wr-scene={key}>
        {key}
      </section>
    ),
    signature: key,
    animate: ({ root }) => gsap.timeline().to(root, { opacity: 1, duration: 3 }),
  };
  return instance;
}

const scenes = [
  scene("total", [{ name: "title", label: "Headline", multiline: true, value: "A big year" }]),
  scene("streak"),
];

const DROPS: readonly HiddenDrop[] = [
  {
    id: "marathon",
    name: "Marathon",
    rarity: "rare",
    kind: "Achievement",
    line: "41 days in a row.",
    art: PIXEL_ART.question,
  },
];

// Hot-linked, so the tile is all there the moment it renders.
const GRAPHICS: readonly WrappedGraphic[] = [
  {
    id: "badge",
    title: "Night Owl",
    line: "A badge for your README.",
    image: "https://orbit.example/ada/night-owl.svg",
    fileName: "night-owl",
  },
];

const SUBJECT = { handle: "ada", name: null, avatarUrl: null, caption: "Orbit Wrapped", period: "2026" };

type ViewProps = Parameters<typeof WrappedView>[0];

/** Someone's own Wrapped with everything a page can have on it: the share row, graphics, and a scan with one find. */
function own(extra: Pick<ViewProps, "className" | "classNames"> = {}) {
  return (
    <WrappedView
      subject={SUBJECT}
      seed="ada"
      scenes={scenes}
      share={{ fileName: "ada-orbit-wrapped.mp4", graphics: GRAPHICS }}
      opening={{
        calendar: { lead: 2, levels: Array.from({ length: 365 }, (_unused, day) => day % 5) },
        drops: DROPS,
        found: ["marathon"],
        onOpen: () => {},
        describeDay: (day) => `Day ${day}`,
      }}
      config={DEFAULT_WRAPPED_CONFIG}
      onConfigChange={() => {}}
      autoplay={false}
      {...extra}
    />
  );
}

/** The same Wrapped as someone else sees it: the video, and what the page puts under it for them. */
function watched() {
  return (
    <WrappedView
      subject={SUBJECT}
      seed="ada"
      scenes={scenes}
      editable={false}
      viewer={<a href="/wrapped">Make your own</a>}
      config={DEFAULT_WRAPPED_CONFIG}
      onConfigChange={() => {}}
      autoplay={false}
    />
  );
}

/** The element a slot names, which has to be on the page. */
function part(slot: string): Element {
  const element = document.querySelector(`[data-wr-slot="${slot}"]`);
  if (!element) throw new Error(`Nothing on the page is the slot "${slot}".`);
  return element;
}

// Mounting a whole page in jsdom takes a while, and longer on a busy machine, so each test gets half a minute.
vi.setConfig({ testTimeout: 30_000 });

describe("the page's slots", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", NoResizes);
    vi.stubGlobal("IntersectionObserver", NoResizes);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Element.prototype.animate = vi.fn<() => Animation>(() => ({ cancel: () => {} }) as unknown as Animation);
    // jsdom has no pointer capture; the timeline asks whether it holds one before it scrubs.
    Element.prototype.hasPointerCapture = () => false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders every slot the page names, between the creator's view and a viewer's", () => {
    // Arrange: the creator's page has everything but the line for viewers, which only a viewer's page has.
    const seen = new Set<string>();
    const look = () => {
      for (const slot of WRAPPED_VIEW_SLOTS) if (document.querySelector(`[data-wr-slot="${slot}"]`)) seen.add(slot);
    };

    // Act
    const creator = render(own());
    look();
    creator.unmount();
    render(watched());
    look();

    // Assert
    expect(WRAPPED_VIEW_SLOTS.filter((slot) => !seen.has(slot))).toEqual([]);
    expect(part("view-viewer")).toHaveTextContent("Make your own");
  });

  it("puts a class given for one of its own slots after the library's classes on that element", () => {
    // Act
    render(own({ className: "my-page", classNames: { "view-player-panel": "my-card", "view-side": "my-column" } }));

    // Assert
    expect(part("view").className).toMatch(/^wr-root wr:scroll-mt-24 .* my-page$/);
    // The attribute the scan finds the page by is still there, next to the new one.
    expect(part("view")).toHaveAttribute("data-wr-view");
    expect(part("view-player-panel").className).toMatch(/^wr:rounded-\[28px\] wr:bg-card .* my-card$/);
    expect(part("view-side").className).toMatch(/ my-column$/);
    expect(part("view-settings-panel").className).not.toMatch(/my-/);
  });

  it("takes the slots of every part it lays out in the same object, and hands each part its own", () => {
    // Arrange
    render(
      own({
        classNames: {
          "player-play": "my-play",
          "timeline-segment-bar": "my-bar",
          "share-copy": "my-copy",
          "settings-chip": "my-chip",
          "scan-again": "my-scan",
          "gallery-tile": "my-tile",
          "editor-save": "my-save",
        },
      }),
    );

    // Act: open the editor of the first scene from its preview on the timeline.
    fireEvent.pointerMove(part("timeline-track"), { pointerType: "mouse", clientX: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Edit total" }));

    // Assert
    expect(screen.getByRole("button", { name: "Play" }).className).toMatch(/ my-play$/);
    expect(part("timeline-segment-bar").className).toMatch(/ my-bar$/);
    expect(screen.getByRole("button", { name: "Copy link" }).className).toMatch(/ my-copy$/);
    expect(screen.getByRole("radio", { name: "1.5x" }).className).toMatch(/ my-chip$/);
    expect(screen.getByRole("button", { name: "Scan again" }).className).toMatch(/ my-scan$/);
    expect(part("gallery-tile").className).toMatch(/ my-tile$/);
    expect(screen.getByRole("button", { name: "Save" }).className).toMatch(/ my-save$/);
    // The share row is its own card on the page: the card is the row's root, slot `share`.
    expect(part("share").className).toMatch(/^wr-root wr:grid .* wr:rounded-\[28px\] /);
  });

  it("takes a provider's classes for the whole page, and puts its own after them", () => {
    // Act
    render(
      <WrappedProvider
        classNames={{ "player-play": "from-provider", "view-gallery": "from-provider", "scan-again": "from-provider" }}
      >
        {own({ classNames: { "player-play": "from-prop", "view-gallery": "from-prop" } })}
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Play" }).className).toMatch(/ from-provider from-prop$/);
    expect(part("view-gallery").className).toBe("wr:lg:col-span-2 from-provider from-prop");
    expect(screen.getByRole("button", { name: "Scan again" }).className).toMatch(/ from-provider$/);
  });
});
