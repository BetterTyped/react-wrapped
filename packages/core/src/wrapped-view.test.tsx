import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { gsap } from "gsap";

import { DEFAULT_WRAPPED_CONFIG } from "./config";
import { renderVideo, type StageTake } from "./export-video";
import type { SceneInstance, WrappedConfig } from "./types";
import { WrappedView } from "./wrapped-view";

vi.mock("./export-video", async (original) => ({
  ...(await original<typeof import("./export-video")>()),
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

function show(config: WrappedConfig = DEFAULT_WRAPPED_CONFIG) {
  return render(
    <WrappedView
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
    expect(take.seconds).toBeCloseTo((window.__wrapped?.duration ?? 0) / 1.5);
    expect(take.intact()).toBe(true);
  });

  it("counts up while the file is made, keeps the page off the stage, and stops when asked", async () => {
    const held = heldRender();
    const { container } = show();
    const player = container.querySelector(".wr-stage")?.closest("[inert], .rounded-\\[28px\\]");

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
