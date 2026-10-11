import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { gsap } from "gsap";
import { useState } from "react";

import { WrappedView } from "./wrapped-view";
import {
  DEFAULT_WRAPPED_CONFIG,
  PIXEL_ART,
  type SceneInstance,
  type StageTake,
  type WrappedConfig,
} from "@react-wrapped/core";
import { renderVideo, type WrappedPlayerHandle } from "@react-wrapped/player";
import type { HiddenDrop } from "@react-wrapped/scan";

vi.mock("@react-wrapped/player", async (original) => ({
  ...(await original<typeof import("@react-wrapped/player")>()),
  renderVideo: vi.fn<typeof renderVideo>(),
}));

const rendering = vi.mocked(renderVideo);

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

/** The player of the view on screen, the way a page holds it. */
const viewPlayer: { current: WrappedPlayerHandle | null } = { current: null };

function show(config: WrappedConfig = DEFAULT_WRAPPED_CONFIG) {
  return render(
    <WrappedView
      playerRef={viewPlayer}
      subject={{ handle: "octocat", name: null, avatarUrl: null, caption: "GitHub Wrapped", period: "2026" }}
      seed="octocat"
      scenes={scenes}
      share={{ fileName: "octocat-github-wrapped.mp4" }}
      config={config}
      onConfigChange={() => {}}
      autoplay={false}
    />,
  );
}

/** A render that stays unfinished until the test ends it, with what it was handed. */
function heldRender() {
  const video = { resolve: (_file: Blob) => {}, reject: (_error: Error) => {} };
  rendering.mockReturnValue(
    new Promise<Blob>((resolve, reject) => {
      video.resolve = resolve;
      video.reject = reject;
    }),
  );
  return {
    finish: (file: Blob) => act(async () => video.resolve(file)),
    fail: (error: Error) => act(async () => video.reject(error)),
    take: () => rendering.mock.calls[0][0],
    options: () => rendering.mock.calls[0][2],
  };
}

describe("WrappedView download", () => {
  const saved: { name: string; href: string }[] = [];

  beforeEach(() => {
    saved.length = 0;
    vi.stubGlobal("ResizeObserver", NoResizes);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:video");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function click(this: HTMLAnchorElement) {
      saved.push({ name: this.download, href: this.href });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    rendering.mockReset();
  });

  it("makes the video from the player's own stage at the format's size and saves it as an mp4", async () => {
    const held = heldRender();
    const { container } = show({ ...DEFAULT_WRAPPED_CONFIG, format: "landscape" });

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(rendering).toHaveBeenCalledTimes(1);
    expect(held.take().stage).toBe(container.querySelector(".wr-stage"));
    expect(rendering.mock.calls[0][1]).toMatchObject({ width: 1920, height: 1080 });

    await held.finish(new Blob(["video"], { type: "video/mp4" }));

    expect(saved).toEqual([{ name: "octocat-github-wrapped.mp4", href: "blob:video" }]);
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("lends out the video at the speed it is set to play", () => {
    const held = heldRender();
    show({ ...DEFAULT_WRAPPED_CONFIG, speed: "1.5" });

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    const take: StageTake = held.take();

    // Faster playback is a shorter file, not the same file played faster.
    expect(take.seconds).toBeCloseTo((viewPlayer.current?.duration() ?? 0) / 1.5);
    expect(take.intact()).toBe(true);
  });

  it("counts up while the file is made, keeps the page off the stage, and stops when asked", async () => {
    const held = heldRender();
    const { container } = show();
    const player = container.querySelector(".wr-stage")?.closest("[inert], .wr\\:rounded-\\[28px\\]");

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    act(() => held.options().onProgress(0.427));

    const stop = screen.getByRole("button", { name: "Stop making the video, 42% done" });
    expect(stop).toHaveTextContent("42%");
    // Two scenes of three seconds at 60 frames a second: the wait is explained by what is being made.
    expect(screen.getByText(/^Drawing \d+ frames at full size, one by one/)).toHaveTextContent(/About \d+s left\.$/);
    // The stage is being filmed: a click on the player or a changed setting would end up in the file.
    expect(player).toHaveAttribute("inert");

    fireEvent.click(stop);
    expect(held.options().signal.aborted).toBe(true);
    await held.fail(new DOMException("Stopped", "AbortError"));

    // Stopping on purpose is not a failure, and the page is handed back.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(saved).toEqual([]);
    await waitFor(() => expect(player).not.toHaveAttribute("inert"));
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("says why when the browser cannot make the video", async () => {
    const held = heldRender();
    show();

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await held.fail(new Error("This browser cannot make the video. Chrome, Edge and Safari can."));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This browser cannot make the video. Chrome, Edge and Safari can.",
    );
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });
});

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
      subject={{ handle: "octocat", name: null, avatarUrl: null, caption: "GitHub Wrapped", period: "2026" }}
      seed="octocat"
      scenes={scenes}
      share={{ fileName: "octocat-github-wrapped.mp4" }}
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
