import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { gsap } from "gsap";

import { SCENE_EDITOR_SLOTS, SceneEditor } from "./scene-editor";
import { SHARE_ACTIONS_SLOTS, ShareActions } from "./share-actions";
import { TIMELINE_SLOTS } from "./timeline";
import { CONFIGURATOR_SLOTS, WrappedConfigurator } from "./wrapped-configurator";
import { WRAPPED_PLAYER_SLOTS, WrappedPlayer, type WrappedPlayerHandle, WrappedPlayerLoading } from "./wrapped-player";
import {
  DEFAULT_WRAPPED_CONFIG,
  type SceneInstance,
  type SlotClassNames,
  type StageTake,
  WrappedProvider,
} from "@react-wrapped/core";

/** An observer that never reports anything: nothing in these tests is resized or scrolled into view. */
class NoResizes {
  observe() {}
  disconnect() {}
  unobserve() {}
}

/** A scene that takes three seconds, which is all the timeline needs to know about it. */
function scene(key: string, extra: Partial<SceneInstance> = {}): SceneInstance {
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
    ...extra,
  };
  return instance;
}

const SUBJECT = { handle: "ada", name: null, avatarUrl: null, caption: "Orbit Wrapped", period: "2026" };
const FIELDS = [
  { name: "title", label: "Headline", multiline: true, value: "A big year" },
  { name: "note", label: "Margin note", multiline: false, value: "All of it" },
];
// The first scene is a found one with words to edit, so its preview shows everything a preview can.
const scenes = [scene("total", { drop: "rare", fields: FIELDS }), scene("streak")];
const NOTHING = () => {};
const EDITING = { scenes, hidden: [], onToggle: NOTHING, onMove: NOTHING, onEdit: NOTHING };

/** The element a slot names, which has to be on the page. */
function part(slot: string): Element {
  const element = document.querySelector(`[data-wr-slot="${slot}"]`);
  if (!element) throw new Error(`Nothing on the page is the slot "${slot}".`);
  return element;
}

/** The slots of a list that nothing on the page carries right now. */
const missing = (slots: readonly string[]) =>
  slots.filter((slot) => document.querySelector(`[data-wr-slot="${slot}"]`) === null);

/** Opens the preview over the first segment, the way a mouse over the row does. */
function hoverFirstSegment() {
  // Every box measures zero here, so a pointer at zero is over the first segment.
  fireEvent.pointerMove(part("timeline-track"), { pointerType: "mouse", clientX: 0 });
}

// Mounting a player in jsdom takes a while, and longer on a busy machine, so each test gets half a minute.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", NoResizes);
  // The transition's preview in the editor only plays while it is on screen. Here it never is.
  vi.stubGlobal("IntersectionObserver", NoResizes);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  Element.prototype.animate = vi.fn<() => Animation>(() => ({ cancel: () => {} }) as unknown as Animation);
  // jsdom has no pointer capture; the timeline asks whether it holds one before it scrubs.
  Element.prototype.hasPointerCapture = () => false;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the player's slots", () => {
  function player(classNames?: Parameters<typeof WrappedPlayer>[0]["classNames"], editing = false) {
    return (
      <WrappedPlayer
        subject={SUBJECT}
        seed="ada"
        scenes={scenes}
        config={DEFAULT_WRAPPED_CONFIG}
        autoplay={false}
        editing={editing ? EDITING : undefined}
        classNames={classNames}
      />
    );
  }

  it("renders every slot the player names", () => {
    // Act
    render(player());

    // Assert
    expect(missing(WRAPPED_PLAYER_SLOTS)).toEqual([]);
  });

  it("renders every slot the timeline names once a creator's preview is open", () => {
    // Arrange
    render(player(undefined, true));

    // Act
    hoverFirstSegment();

    // Assert
    expect(missing(TIMELINE_SLOTS)).toEqual([]);
  });

  it("puts a class given for a slot after the library's own classes on that element", () => {
    // Act
    render(player({ "player-play": "my-play", player: "my-root" }));

    // Assert
    const play = screen.getByRole("button", { name: "Play" });
    expect(play).toHaveAttribute("data-wr-slot", "player-play");
    expect(play.className).toMatch(/^wr:grid wr:size-11 .* wr:hover:-translate-y-px my-play$/);
    expect(part("player").className).toMatch(/^wr-root wr:flex .* my-root$/);
    // A slot nobody named keeps exactly the library's classes.
    expect(screen.getByRole("button", { name: "Play from the start" }).className).not.toMatch(/my-/);
  });

  it("hands the timeline's slots on to the timeline it renders", () => {
    // Arrange
    render(
      player(
        { "timeline-segment-bar": "my-bar", "timeline-preview": "my-card", "timeline-toggle-thumb": "my-dot" },
        true,
      ),
    );

    // Act
    hoverFirstSegment();

    // Assert
    for (const bar of document.querySelectorAll('[data-wr-slot="timeline-segment-bar"]')) {
      expect(bar.className).toMatch(/ my-bar$/);
      // The attributes the engine reads are still there, next to the new one.
      expect(bar).toHaveAttribute("data-seg-bar");
    }
    expect(part("timeline-preview").className).toMatch(/^wr:rounded-\[18px\] .* my-card$/);
    expect(screen.getByRole("switch").firstElementChild?.className).toMatch(/ my-dot$/);
  });

  it("takes a provider's class for a slot, and puts the player's own after it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ "player-play": "from-provider", "timeline-track": "track-from-provider" }}>
        {player({ "player-play": "from-prop" })}
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Play" }).className).toMatch(/ from-provider from-prop$/);
    // The provider reaches the timeline inside the player too.
    expect(part("timeline-track").className).toMatch(/ track-from-provider$/);
  });

  it("gives the player waiting for its year the same slots, so it is restyled the same way", () => {
    // Arrange
    const classNames: SlotClassNames<"player-frame" | "player-play" | "timeline-segment-bar"> = {
      "player-frame": "my-frame",
      "player-play": "my-play",
      "timeline-segment-bar": "my-bar",
    };

    // Act
    render(
      <WrappedPlayerLoading
        subject={{ handle: "ada", caption: "Orbit Wrapped" }}
        lines={["Reading your year."]}
        config={DEFAULT_WRAPPED_CONFIG}
        classNames={classNames}
      />,
    );

    // Assert
    expect(missing([...WRAPPED_PLAYER_SLOTS, "timeline", "timeline-segment-bar"])).toEqual([]);
    expect(part("player-frame").className).toMatch(/ my-frame$/);
    expect(part("player-play").className).toMatch(/ my-play$/);
    expect(part("timeline-segment-bar").className).toMatch(/ my-bar$/);
  });
});

describe("the settings' slots", () => {
  // Your own colour, so the row with the colour input is there too.
  const custom = { ...DEFAULT_WRAPPED_CONFIG, palette: "custom" };

  it("renders every slot the settings name", () => {
    // Act
    render(<WrappedConfigurator config={custom} onChange={NOTHING} />);

    // Assert
    expect(missing(CONFIGURATOR_SLOTS)).toEqual([]);
  });

  it("puts a class given for a slot after the library's own, on every element of that slot", () => {
    // Act
    render(
      <WrappedConfigurator
        config={custom}
        onChange={NOTHING}
        className="my-panel"
        classNames={{ "settings-chip": "my-chip", "settings-swatch": "my-swatch", "settings-switch": "my-switch" }}
      />,
    );

    // Assert
    expect(part("settings").className).toBe("wr-root wr:flex wr:flex-col wr:gap-6 my-panel");
    const speed = screen.getByRole("radio", { name: "1.5x" });
    expect(speed).toHaveAttribute("data-wr-slot", "settings-chip");
    expect(speed.className).toMatch(/^wr:inline-flex wr:h-9 .* my-chip$/);
    expect(screen.getByRole("radio", { name: "Evergreen" }).className).toMatch(/ my-swatch$/);
    expect(screen.getByRole("switch", { name: "Film grain" }).className).toMatch(/^wr:peer .* my-switch$/);
    // A chip is not a swatch: each slot's class stays on its own elements.
    expect(speed.className).not.toMatch(/my-swatch/);
  });

  it("takes a provider's class for a slot, and puts the panel's own after it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ "settings-chip": "from-provider", "settings-label": "label-from-provider" }}>
        <WrappedConfigurator config={custom} onChange={NOTHING} classNames={{ "settings-chip": "from-prop" }} />
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Dark" }).className).toMatch(/ from-provider from-prop$/);
    expect(screen.getByText("Format").className).toMatch(/ label-from-provider$/);
  });
});

describe("the share row's slots", () => {
  /** A player that lends out a stage, which is as far as a download gets here: this browser cannot encode video. */
  function lendingPlayer(): { current: WrappedPlayerHandle } {
    const take: StageTake = {
      stage: document.createElement("div"),
      seconds: 1,
      show: NOTHING,
      intact: () => true,
      release: NOTHING,
    };
    return {
      current: {
        play: NOTHING,
        pause: NOTHING,
        restart: NOTHING,
        seek: NOTHING,
        duration: () => 1,
        scenes: () => [],
        take: () => take,
      },
    };
  }

  it("renders every slot the share row names, across a download that is started and then fails", async () => {
    // Arrange
    // No state of the row shows all of them at once, so each state adds the ones it shows.
    const seen = new Set<string>();
    const look = () => {
      for (const slot of SHARE_ACTIONS_SLOTS) if (missing([slot]).length === 0) seen.add(slot);
    };
    render(<ShareActions player={lendingPlayer()} config={DEFAULT_WRAPPED_CONFIG} fileName="ada-orbit-wrapped.mp4" />);
    look();

    // Act: the file is being made as soon as the button is pressed, and jsdom then says it cannot encode it.
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    look();
    const whileMaking = [...seen];
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    look();

    // Assert
    expect(whileMaking).toEqual(expect.arrayContaining(["share-stop", "share-progress"]));
    expect(SHARE_ACTIONS_SLOTS.filter((slot) => !seen.has(slot))).toEqual([]);
    expect(screen.getByRole("alert")).toHaveAttribute("data-wr-slot", "share-problem");
  });

  it("puts a class given for a slot after the library's own, which stay exactly as they were", () => {
    // Act
    render(
      <ShareActions
        player={lendingPlayer()}
        config={DEFAULT_WRAPPED_CONFIG}
        fileName="ada-orbit-wrapped.mp4"
        classNames={{ "share-copy": "my-copy" }}
      />,
    );

    // Assert
    const copy = screen.getByRole("button", { name: "Copy link" });
    expect(copy.className).toMatch(/^wr:inline-flex wr:h-11 .* wr:bg-foreground wr:px-3 wr:text-background my-copy$/);
    // Both paddings the button has always named are still there: dropping one would change its width.
    expect(copy).toHaveClass("wr:px-5", "wr:px-3");
    expect(screen.getByRole("button", { name: "Download" }).className).not.toMatch(/my-/);
  });

  it("takes a provider's class for a slot, and puts the row's own after it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ "share-download": "from-provider", share: "row-from-provider" }}>
        <ShareActions
          player={lendingPlayer()}
          config={DEFAULT_WRAPPED_CONFIG}
          fileName="ada-orbit-wrapped.mp4"
          classNames={{ "share-download": "from-prop" }}
        />
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Download" }).className).toMatch(/ from-provider from-prop$/);
    expect(part("share").className).toBe("wr-root wr:grid wr:grid-cols-2 wr:gap-2 row-from-provider");
  });
});

describe("the scene editor's slots", () => {
  function editor(classNames?: Parameters<typeof SceneEditor>[0]["classNames"]) {
    return (
      <SceneEditor
        scene={scenes[0]}
        original={scenes[0]}
        cut={{ style: "wave", original: "slash", next: scenes[1] }}
        config={DEFAULT_WRAPPED_CONFIG}
        onSave={NOTHING}
        onClose={NOTHING}
        classNames={classNames}
      />
    );
  }

  it("renders every slot the editor names for a scene with words and a way out", () => {
    // Act
    render(editor());

    // Assert
    expect(missing(SCENE_EDITOR_SLOTS)).toEqual([]);
  });

  it("puts a class given for a slot after the library's own, on the dialog and inside it", () => {
    // Act
    render(editor({ editor: "my-dialog", "editor-save": "my-save", "editor-input": "my-input" }));

    // Assert
    expect(screen.getByRole("dialog").className).toMatch(/^wr-root wr:m-auto .* my-dialog$/);
    expect(screen.getByRole("button", { name: "Save" }).className).toMatch(/^wr:inline-flex wr:h-11 .* my-save$/);
    // A field of one line and a field of several are the same slot.
    expect(screen.getByLabelText("Headline").className).toMatch(/ my-input$/);
    expect(screen.getByLabelText("Margin note").className).toMatch(/ my-input$/);
  });

  it("takes a provider's class for a slot, and puts the editor's own after it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ "editor-transition": "from-provider", "editor-title": "title-from-provider" }}>
        {editor({ "editor-transition": "from-prop" })}
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Wave" }).className).toMatch(/ from-provider from-prop$/);
    expect(part("editor-title").className).toMatch(/ title-from-provider$/);
  });
});
