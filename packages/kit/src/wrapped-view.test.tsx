import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { gsap } from "gsap";
import { useState } from "react";

import { WrappedView } from "./wrapped-view";
import { DEFAULT_WRAPPED_CONFIG, PIXEL_ART, type SceneInstance } from "@react-wrapped/core";
import type { WrappedPlayerHandle } from "@react-wrapped/player";
import type { HiddenDrop } from "@react-wrapped/scan";

class NoResizes {
  observe() {}
  disconnect() {}
  unobserve() {}
}

/** A scene that takes three seconds, which is all the timeline needs to know about it. */
function scene(key: string): SceneInstance {
  const instance: SceneInstance = {
    key,
    label: key,
    fields: [],
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

const scenes = [scene("total"), scene("streak")];

class NothingInView {
  observe() {}
  disconnect() {}
  unobserve() {}
}

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

/** Someone's own Wrapped, with what they have opened kept the way a page keeps it. */
function Own({ opened = [], gate = true }: { opened?: readonly string[]; gate?: boolean }) {
  const [found, setFound] = useState(opened);
  return (
    <WrappedView
      subject={{ handle: "ada", name: null, avatarUrl: null, caption: "Orbit Wrapped", period: "2026" }}
      seed="ada"
      scenes={scenes}
      share={{ fileName: "ada-orbit-wrapped.mp4" }}
      opening={{
        calendar: { lead: 2, levels: Array.from({ length: 365 }, (_unused, day) => day % 5) },
        drops: DROPS,
        found,
        onOpen: (id) => setFound((now) => (now.includes(id) ? now : [...now, id])),
        describeDay: (day) => `Day ${day}`,
        gate,
      }}
      config={DEFAULT_WRAPPED_CONFIG}
      onConfigChange={() => {}}
      autoplay={false}
    />
  );
}

describe("WrappedView scan first", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", NoResizes);
    vi.stubGlobal("IntersectionObserver", NothingInView);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Element.prototype.scrollIntoView = vi.fn<() => void>();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens on the scan alone when nothing has been found yet", () => {
    // Act
    const { container } = render(<Own />);

    // Assert
    expect(screen.getByText("Your Wrapped is almost ready.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find my scenes" })).toBeInTheDocument();
    expect(container.querySelector(".wr-stage")).toBeNull();
    expect(screen.queryByRole("button", { name: "Download" })).toBeNull();
  });

  it("goes straight to the video for someone who has already scanned", () => {
    // Act
    const { container } = render(<Own opened={["streak"]} />);

    // Assert
    expect(container.querySelector(".wr-stage")).not.toBeNull();
    expect(screen.queryByText("Your Wrapped is almost ready.")).toBeNull();
    expect(screen.getByRole("button", { name: "Keep scanning" })).toBeInTheDocument();
  });

  it("plays an example right away, its scan under the video", () => {
    // Act
    const { container } = render(<Own gate={false} />);

    // Assert
    expect(container.querySelector(".wr-stage")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Scan my year" })).toBeInTheDocument();
  });

  it("stays on the scan while it runs and hands over to the video once it has found everything", async () => {
    // Arrange
    const { container } = render(<Own />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Find my scenes" }));
    // The first find must not bring the video in under the ones still to come.
    expect(container.querySelector(".wr-stage")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Find all" }));

    // Assert
    expect(screen.getByText("You found all 2.")).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector(".wr-stage")).not.toBeNull(), { timeout: 3000 });
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan again" })).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("keeps the video up when a later scan is run under it", () => {
    // Arrange
    const { container } = render(<Own opened={["streak"]} />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Keep scanning" }));

    // Assert
    expect(container.querySelector(".wr-stage")).not.toBeNull();
  });
});

describe("WrappedView player handle", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", NoResizes);
    vi.stubGlobal("IntersectionObserver", NothingInView);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives each view on a page its own player to drive", () => {
    // Arrange
    const first: { current: WrappedPlayerHandle | null } = { current: null };
    const second: { current: WrappedPlayerHandle | null } = { current: null };
    const view = (ref: typeof first, list: readonly SceneInstance[]) => (
      <WrappedView
        playerRef={ref}
        subject={{ handle: "ada", name: null, avatarUrl: null, caption: "Orbit Wrapped", period: "2026" }}
        seed="ada"
        scenes={list}
        config={DEFAULT_WRAPPED_CONFIG}
        onConfigChange={() => {}}
        autoplay={false}
      />
    );
    render(
      <>
        {view(first, scenes)}
        {view(second, [scene("only")])}
      </>,
    );

    // Act
    first.current?.seek(4);

    // Assert
    expect(first.current?.scenes().map((mark) => mark.key)).toEqual(["total", "streak"]);
    expect(second.current?.scenes().map((mark) => mark.key)).toEqual(["only"]);
    expect(first.current?.duration()).toBeGreaterThan(second.current?.duration() ?? 0);
    // Nothing is left on the page for two players to fight over.
    expect("__wrapped" in window).toBe(false);
  });
});
