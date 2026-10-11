import { fireEvent, render, screen, within } from "@testing-library/react";
import { gsap } from "gsap";

import { SceneEditor } from "./scene-editor";
import { WrappedConfigurator } from "./wrapped-configurator";
import { WrappedPlayer, WrappedPlayerLoading } from "./wrapped-player";
import { DEFAULT_WRAPPED_CONFIG, type SceneInstance, WrappedProvider } from "@react-wrapped/core";

/** An observer that never reports anything: nothing in these tests is resized or scrolled into view. */
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

const SUBJECT = { handle: "ada", name: null, avatarUrl: null, caption: "Orbit Wrapped", period: "2026" };
const scenes = [scene("total"), scene("streak")];

function player() {
  return (
    <WrappedPlayer subject={SUBJECT} seed="ada" scenes={scenes} config={DEFAULT_WRAPPED_CONFIG} autoplay={false} />
  );
}

// Mounting a player in jsdom takes a while, and longer on a busy machine, so each test gets half a minute.
vi.setConfig({ testTimeout: 30_000 });

describe("the player's labels", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", NoResizes);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Element.prototype.animate = vi.fn<() => Animation>(() => ({ cancel: () => {} }) as unknown as Animation);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("says everything in English when no provider is on the page", () => {
    // Act
    const { container } = render(player());

    // Assert
    const toolbar = screen.getByRole("toolbar", {
      name: "Video controls. Left and right arrows step between scenes.",
    });
    expect(within(toolbar).getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "Play from the start" })).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "Full screen" })).toBeInTheDocument();
    expect(container.querySelector(".wr\\:tabular-nums")).toHaveTextContent(/^\d:\d\d \/ \d:\d\d$/);
  });

  it("takes its words from the provider, the clock the engine writes included", () => {
    // Act
    const { container } = render(
      <WrappedProvider
        labels={{
          player: {
            controls: "Sterowanie",
            play: "Odtwórz",
            restart: "Od początku",
            fullscreen: "Pełny ekran",
            clock: (elapsed, total) => `${elapsed} z ${total}`,
          },
        }}
      >
        {player()}
      </WrappedProvider>,
    );

    // Assert
    const toolbar = screen.getByRole("toolbar", { name: "Sterowanie" });
    expect(within(toolbar).getByRole("button", { name: "Odtwórz" })).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "Od początku" })).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "Pełny ekran" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
    expect(container.querySelector(".wr\\:tabular-nums")).toHaveTextContent(/^\d:\d\d z \d:\d\d$/);
  });

  it("keeps the playhead's time on the clock when the words change under a paused video", () => {
    // Arrange: two scenes of three seconds, paused at the start.
    const { container, rerender } = render(<WrappedProvider labels={{}}>{player()}</WrappedProvider>);
    const before = container.querySelector(".wr\\:tabular-nums")?.textContent;

    // Act
    rerender(
      <WrappedProvider labels={{ player: { clock: (elapsed, total) => `${elapsed} z ${total}` } }}>
        {player()}
      </WrappedProvider>,
    );

    // Assert: the same times, in the new words, not the resting zeros React rendered.
    expect(before).toMatch(/^0:00 \/ 0:0[1-9]$/);
    expect(container.querySelector(".wr\\:tabular-nums")).toHaveTextContent(before?.replace("/", "z") ?? "");
  });

  it("writes the resting clock of a player still waiting for its year the provider's way", () => {
    // Act
    render(
      <WrappedProvider labels={{ player: { clock: (elapsed, total) => `${elapsed} z ${total}` } }}>
        <WrappedPlayerLoading
          subject={{ handle: "ada", caption: "Orbit Wrapped" }}
          lines={["Reading your year."]}
          config={DEFAULT_WRAPPED_CONFIG}
        />
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByText("0:00 z 0:00")).toBeInTheDocument();
  });
});

describe("the settings' labels", () => {
  it("says everything in English when no provider is on the page", () => {
    // Act
    render(<WrappedConfigurator config={{ ...DEFAULT_WRAPPED_CONFIG, palette: "custom" }} onChange={() => {}} />);

    // Assert
    expect(screen.getByRole("radiogroup", { name: "Palette" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Evergreen" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Your color" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Pick a random color" })).toHaveAttribute("title", "Random color");
    expect(screen.getByRole("radiogroup", { name: "Dark or light" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "9:16" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Rounded" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1.5x" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Film grain" })).toBeInTheDocument();
  });

  it("takes its words from the provider, palette and format names by id included", () => {
    // Act
    render(
      <WrappedProvider
        labels={{
          settings: {
            colors: "Kolory",
            dark: "Ciemny",
            shapes: { circle: "Kropki" },
            speedValue: (speed) => `${speed} raza`,
            grain: "Ziarno",
          },
          palettes: { evergreen: "Las" },
          formats: { story: "Pion" },
        }}
      >
        <WrappedConfigurator config={DEFAULT_WRAPPED_CONFIG} onChange={() => {}} />
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByText("Kolory")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Ciemny" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Kropki" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1.5 raza" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Ziarno" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Las" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Pion" })).toBeInTheDocument();
    // What the provider did not name keeps its built-in name.
    expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Ice" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1:1" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Square" })).toBeInTheDocument();
  });

  it("lets a provider further down reword one thing and keep the rest", () => {
    // Act
    render(
      <WrappedProvider labels={{ settings: { colors: "Kolory", speed: "Tempo" } }}>
        <WrappedProvider labels={{ settings: { speed: "Szybkość" } }}>
          <WrappedConfigurator config={DEFAULT_WRAPPED_CONFIG} onChange={() => {}} />
        </WrappedProvider>
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByText("Kolory")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Szybkość" })).toBeInTheDocument();
    expect(screen.queryByText("Tempo")).toBeNull();
  });
});

describe("the scene editor's labels", () => {
  const editable = scene("total", [
    { name: "title", label: "Headline", multiline: true, value: "A big year" },
    { name: "note", label: "Margin note", multiline: false, value: "All of it" },
  ]);

  function editor() {
    return (
      <SceneEditor
        scene={editable}
        original={editable}
        cut={{ style: "wave", original: "slash", next: scenes[1] }}
        config={DEFAULT_WRAPPED_CONFIG}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
  }

  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    // The transition's preview only plays while it is on screen. Here it never is.
    vi.stubGlobal("IntersectionObserver", NoResizes);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("says everything in English when no provider is on the page", () => {
    // Act
    render(editor());

    // Assert
    expect(screen.getByRole("dialog", { name: 'Edit "total"' })).toBeInTheDocument();
    expect(screen.getByLabelText("Headline")).toHaveValue("A big year");
    expect(screen.getByRole("radio", { name: "Wave" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Original scene" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("takes its words from the provider: the title with the scene's name, fields, transitions and buttons", () => {
    // Arrange
    const title = vi.fn<(name: string) => string>((name) => `Edytuj „${name}”`);

    // Act
    render(
      <WrappedProvider
        labels={{
          editor: { title, cut: "Przejście", reset: "Przywróć", save: "Zapisz" },
          fields: { Headline: "Nagłówek" },
          transitions: { wave: "Fala" },
        }}
      >
        {editor()}
      </WrappedProvider>,
    );

    // Assert
    expect(title).toHaveBeenCalledWith("total");
    expect(screen.getByRole("dialog", { name: "Edytuj „total”" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nagłówek")).toHaveValue("A big year");
    // A field the provider has no word for keeps the scene's own name for it.
    expect(screen.getByLabelText("Margin note")).toHaveValue("All of it");
    expect(
      within(screen.getByRole("radiogroup", { name: "Przejście" })).getByRole("radio", { name: "Fala" }),
    ).toBeChecked();
    expect(screen.getByRole("radio", { name: "Slash" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Przywróć" }));
    expect(screen.getByRole("radio", { name: "Slash" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Zapisz" })).toBeInTheDocument();
  });
});
