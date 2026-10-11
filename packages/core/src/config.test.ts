import {
  arrangeScenes,
  configFromSearch,
  DEFAULT_WRAPPED_CONFIG,
  editsFor,
  searchFromConfig,
  wrappedSearchSchema,
} from "./config";
import type { WrappedConfig } from "./types";

describe("wrapped config in the URL", () => {
  it("round-trips every field through search params", () => {
    // Arrange
    const config: WrappedConfig = {
      palette: "custom",
      accent: "#ff3366",
      mode: "light",
      format: "landscape",
      shape: "circle",
      speed: "1.5",
      cuts: { total: "wipe", "drop-big-bang": "iris" },
      hidden: ["streak", "repos"],
      order: ["total", "opening"],
      edits: { "opening.title": "Shipped *it*.", "total.lede": "A lot, honestly." },
      grain: false,
    };

    // Act
    const back = configFromSearch(wrappedSearchSchema.parse(searchFromConfig(config)));

    // Assert
    expect(back).toEqual(config);
  });

  it("keeps a default link free of params", () => {
    // Act
    const search = searchFromConfig(DEFAULT_WRAPPED_CONFIG);

    // Assert
    expect(Object.values(search).filter((value) => value !== undefined)).toEqual([]);
  });

  it("leaves a scene to its luck when the link names a transition that is gone", () => {
    // Act
    const config = configFromSearch(wrappedSearchSchema.parse({ t: "total:ripple,busiest:wipe" }));

    // Assert
    expect(config.cuts).toEqual({ busiest: "wipe" });
  });

  it("plays a link from when one transition was set for the whole video with each scene's own", () => {
    // Act
    const config = configFromSearch(wrappedSearchSchema.parse({ t: "wipe" }));

    // Assert
    expect(config.cuts).toEqual({});
  });

  it("plays a mangled link with defaults instead of failing", () => {
    // Act
    const config = configFromSearch(
      wrappedSearchSchema.parse({ p: "nope", a: "zzz", f: "vertical", s: "9", e: "{not json" }),
    );

    // Assert
    expect(config).toEqual(DEFAULT_WRAPPED_CONFIG);
  });
});

describe("themes and the light switch", () => {
  it("opens a link from before dark and light were one switch as what it was", () => {
    // Act
    const light = configFromSearch(wrappedSearchSchema.parse({ p: "github-light" }));
    const dark = configFromSearch(wrappedSearchSchema.parse({ p: "github-dark" }));

    // Assert
    expect(light).toMatchObject({ palette: "github", mode: "light" });
    expect(dark).toMatchObject({ palette: "github", mode: "dark" });
  });

  it("carries light mode in the link for any theme, not only a custom color", () => {
    // Arrange
    const config: WrappedConfig = { ...DEFAULT_WRAPPED_CONFIG, palette: "grape", mode: "light" };

    // Act
    const search = searchFromConfig(config);

    // Assert
    expect(search).toMatchObject({ p: "grape", m: "light" });
    expect(configFromSearch(wrappedSearchSchema.parse(search))).toMatchObject({ palette: "grape", mode: "light" });
  });
});

describe("arrangeScenes", () => {
  const scenes = ["opening", "total", "busiest", "summary"].map((key) => ({ key }));

  it("follows the viewer's order and keeps unplaced scenes next to the scene the director put before them", () => {
    // Act
    const arranged = arrangeScenes(scenes, ["busiest", "opening"]);

    // Assert
    expect(arranged.map((scene) => scene.key)).toEqual(["busiest", "opening", "total", "summary"]);
  });

  it("ignores keys that are no longer in the cut", () => {
    // Act
    const arranged = arrangeScenes(scenes, ["gone", "summary"]);

    // Assert
    expect(arranged.map((scene) => scene.key)).toEqual(["opening", "total", "busiest", "summary"]);
  });

  it("slots a newly found drop into its story place after the cut was reordered by hand", () => {
    // Arrange: the viewer swapped two scenes, then the scan found a drop the director puts after "busiest".
    const withDrop = ["opening", "total", "busiest", "drop-big-bang", "summary"].map((key) => ({ key }));

    // Act
    const arranged = arrangeScenes(withDrop, ["opening", "busiest", "total", "summary"]);

    // Assert
    expect(arranged.map((scene) => scene.key)).toEqual(["opening", "busiest", "drop-big-bang", "total", "summary"]);
  });
});

describe("editsFor", () => {
  it("picks one scene's edits out of the flat map, without its prefix", () => {
    // Act
    const edits = editsFor({ "opening.title": "Hi", "opening.period": "2026", "total.lede": "Wow" }, "opening");

    // Assert
    expect(edits).toEqual({ title: "Hi", period: "2026" });
  });
});
