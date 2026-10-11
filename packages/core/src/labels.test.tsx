import { render, screen } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_LABELS,
  DEFAULT_LOCALE,
  Label,
  mergeLabels,
  RarityLabel,
  useLabels,
  useLocale,
  WrappedProvider,
} from "./labels";
import { RARITY_LABELS } from "./rarity";

/** Every path in a table of labels that ends in a string, a function, or a table that starts out empty. */
const leaves = (group: object, path: readonly string[] = []): string[][] =>
  Object.entries(group).flatMap(([key, value]) =>
    typeof value === "object" && value !== null && Object.keys(value).length > 0
      ? leaves(value, [...path, key])
      : [[...path, key]],
  );

/** A button that reads two labels and the locale, the way the chrome does. */
function Probe() {
  const labels = useLabels();
  const locale = useLocale();
  return (
    <button type="button" aria-label={labels.player.play} title={labels.player.pause}>
      {locale}
    </button>
  );
}

describe("WrappedProvider", () => {
  it("leaves the English defaults in place when no provider is on the page", () => {
    // Act
    render(<Probe />);

    // Assert
    const button = screen.getByRole("button", { name: "Play" });
    expect(button).toHaveAttribute("title", "Pause");
    expect(button).toHaveTextContent(DEFAULT_LOCALE);
  });

  it("replaces only the labels it was given", () => {
    // Act
    render(
      <WrappedProvider labels={{ player: { play: "Odtwórz" } }} locale="pl-PL">
        <Probe />
      </WrappedProvider>,
    );

    // Assert
    const button = screen.getByRole("button", { name: "Odtwórz" });
    expect(button).toHaveAttribute("title", "Pause");
    expect(button).toHaveTextContent("pl-PL");
  });

  it("lays a nested provider over the one above it, and keeps that one's locale", () => {
    // Act
    render(
      <WrappedProvider labels={{ player: { play: "Odtwórz", pause: "Wstrzymaj" } }} locale="pl-PL">
        <WrappedProvider labels={{ player: { play: "Start" } }}>
          <Probe />
        </WrappedProvider>
      </WrappedProvider>,
    );

    // Assert
    const button = screen.getByRole("button", { name: "Start" });
    expect(button).toHaveAttribute("title", "Wstrzymaj");
    expect(button).toHaveTextContent("pl-PL");
  });

  it("gives scenes, which are built outside React, the provider's words through a component", () => {
    // Arrange: markup made before any provider exists, the way a director makes a scene.
    const content = (
      <p>
        <RarityLabel rarity="epic" /> / <Label of={(labels) => labels.scenes.more(3)} />
      </p>
    );

    // Act
    const { container, rerender } = render(content);
    const plain = container.textContent;
    rerender(
      <WrappedProvider labels={{ rarity: { epic: "Epicki" }, scenes: { more: (count) => `i ${count} więcej` } }}>
        {content}
      </WrappedProvider>,
    );

    // Assert
    expect(plain).toBe("Epic / +3 more");
    expect(container).toHaveTextContent("Epicki / i 3 więcej");
  });
});

describe("mergeLabels", () => {
  it("replaces a leaf at any depth and keeps everything beside it", () => {
    // Act
    const labels = mergeLabels(DEFAULT_LABELS, {
      settings: { shapes: { circle: "Kropki" } },
      palettes: { evergreen: "Las" },
    });

    // Assert
    expect(labels.settings.shapes).toEqual({ round: "Rounded", square: "Square", circle: "Kropki" });
    expect(labels.settings.colors).toBe("Colors");
    expect(labels.palettes.evergreen).toBe("Las");
    expect(labels.scan).toBe(DEFAULT_LABELS.scan);
  });

  it("does not blank a label that was passed as undefined", () => {
    // Act
    const labels = mergeLabels(DEFAULT_LABELS, { share: { download: undefined } });

    // Assert
    expect(labels.share.download).toBe("Download");
  });

  it("hands a function label its numbers", () => {
    // Arrange
    const hiding = vi.fn<(count: number) => string>((count) => `Ukryte sceny: ${count}`);

    // Act
    const labels = mergeLabels(DEFAULT_LABELS, { scan: { hiding } });
    const line = labels.scan.hiding(4);

    // Assert
    expect(hiding).toHaveBeenCalledWith(4);
    expect(line).toBe("Ukryte sceny: 4");
  });
});

describe("DEFAULT_LABELS", () => {
  it("keeps the plurals the chrome had before the labels were a table", () => {
    // Act
    const lines = [
      DEFAULT_LABELS.scan.hiding(1),
      DEFAULT_LABELS.scan.hiding(3),
      DEFAULT_LABELS.scan.moreHiding(1),
      DEFAULT_LABELS.scan.moreHiding(2),
      DEFAULT_LABELS.scan.aboutWaiting(1),
      DEFAULT_LABELS.gallery.count(1),
      DEFAULT_LABELS.gallery.aboutLocked(1),
      DEFAULT_LABELS.gallery.aboutLocked(2),
      DEFAULT_LABELS.timeline.length(4),
      DEFAULT_LABELS.timeline.length(65),
      DEFAULT_LABELS.share.drawing("3,362", null),
      DEFAULT_LABELS.share.drawing("3,362", DEFAULT_LABELS.share.secondsLeft(40)),
    ];

    // Assert
    expect(lines).toEqual([
      "Your year is hiding 1 scene.",
      "Your year is hiding 3 scenes.",
      "1 more is hiding in your year.",
      "2 more are hiding in your year.",
      "Your year is hiding 1 scene only you get. Find it and your video plays.",
      "1 graphic",
      "Post them, pin them, put them in your README. 1 more unlocks as the scan finds it.",
      "Post them, pin them, put them in your README. 2 more unlock as the scan finds them.",
      "4s",
      "1:05",
      "Drawing 3,362 frames at full size, one by one, so the video is sharp and smooth on any machine.",
      "Drawing 3,362 frames at full size, one by one, so the video is sharp and smooth on any machine. About 40s left.",
    ]);
  });

  it("says the rarities the way RARITY_LABELS does", () => {
    // Assert
    expect(DEFAULT_LABELS.rarity).toEqual(RARITY_LABELS);
  });

  it("has no label that nothing reads", () => {
    // Arrange: every source file of every package, tests and the table itself left out.
    const packages = join(import.meta.dirname, "../..");
    const sources = readdirSync(packages)
      .flatMap((name) => {
        const src = join(packages, name, "src");
        return readdirSync(src, { recursive: true, encoding: "utf8" })
          .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith("labels.tsx"))
          .map((file) => readFileSync(join(src, file), "utf8"));
      })
      .join("\n");
    // A label is read by its full path (`labels.player.play`), or the table it sits in is read by a key that is only
    // known when the page runs (`labels.rarity[drop]`).
    const read = (path: readonly string[]) => {
      const whole = `labels.${path.join(".")}`.replaceAll(".", String.raw`\.`);
      const table = `labels.${path.slice(0, -1).join(".")}[`;
      return new RegExp(String.raw`${whole}(?!\w)`).test(sources) || (path.length > 1 && sources.includes(table));
    };

    // Act
    const all = leaves(DEFAULT_LABELS);
    const unread = all.filter((path) => !read(path)).map((path) => path.join("."));

    // Assert
    expect(all.length).toBeGreaterThan(100);
    expect(unread).toEqual([]);
  });
});
