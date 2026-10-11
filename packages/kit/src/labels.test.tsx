import { fireEvent, render, screen } from "@testing-library/react";
import { gsap } from "gsap";

import { WrappedView } from "./wrapped-view";
import { DEFAULT_WRAPPED_CONFIG, type SceneInstance, WrappedProvider } from "@react-wrapped/core";

class NoResizes {
  observe() {}
  disconnect() {}
  unobserve() {}
}

/** A scene that only has a length: the view needs nothing else from it. */
function scene(key: string, seconds: number): SceneInstance {
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
    animate: ({ root }) => gsap.timeline().to(root, { opacity: 1, duration: seconds }),
  };
  return instance;
}

function view() {
  return (
    <WrappedView
      subject={{ handle: "ada", name: null, avatarUrl: null, caption: "Orbit Wrapped", period: "2026" }}
      seed="ada"
      // Twenty seconds at 60 frames a second: enough frames for the count to need a thousands separator.
      scenes={[scene("total", 20)]}
      share={{ fileName: "ada-orbit-wrapped.mp4" }}
      config={DEFAULT_WRAPPED_CONFIG}
      onConfigChange={() => {}}
      autoplay={false}
    />
  );
}

// Mounting the whole view in jsdom takes a while, and longer on a busy machine, so each test gets half a minute.
vi.setConfig({ testTimeout: 30_000 });

describe("the share row's labels", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", NoResizes);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("says everything in English when no provider is on the page", () => {
    // Act
    render(view());

    // Assert
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("takes its words from the provider", () => {
    // Act
    render(
      <WrappedProvider labels={{ share: { copyLink: "Kopiuj link", download: "Pobierz" } }}>{view()}</WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Kopiuj link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pobierz" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download" })).toBeNull();
  });

  it("writes the frame count in the provider's locale and hands it to the provider's sentence", async () => {
    // Arrange
    const drawing = vi.fn<(frames: string, left: string | null) => string>((frames) => `Rysuję ${frames} klatek.`);
    render(
      <WrappedProvider locale="de-DE" labels={{ share: { drawing, stop: "Zatrzymaj" } }}>
        {view()}
      </WrappedProvider>,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    // Assert: German groups thousands with a dot, where the default locale would have used a comma.
    expect(screen.getByText(/^Rysuję \d\.\d{3} klatek\.$/)).toBeInTheDocument();
    expect(drawing).toHaveBeenCalledWith(expect.stringMatching(/^\d\.\d{3}$/), null);
    expect(screen.getByRole("button", { name: /^Stop making the video, 0% done$/ })).toHaveAttribute(
      "title",
      "Zatrzymaj",
    );
    // jsdom cannot encode a video, so the attempt ends here; waiting for that keeps it inside the test.
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("says why the video could not be made in the provider's words", async () => {
    // Arrange: jsdom has no video encoder, so making the file fails the way an old browser would.
    render(
      <WrappedProvider labels={{ video: { unsupported: "Ta przeglądarka nie zrobi filmu." } }}>
        {view()}
      </WrappedProvider>,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    // Assert
    expect(await screen.findByRole("alert")).toHaveTextContent("Ta przeglądarka nie zrobi filmu.");
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });
});
