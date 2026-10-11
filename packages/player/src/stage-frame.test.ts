import { frameMarkup, ruleReaches } from "./stage-frame";

function stageWith(html: string): HTMLElement {
  document.body.innerHTML = `<div class="wr-stage" style="width: 1080px; transform: scale(0.4)">${html}</div>`;
  return document.body.firstElementChild as HTMLElement;
}

describe("ruleReaches", () => {
  const stage = () => stageWith(`<section class="wr-scene"><h2 class="font-semibold">Hi</h2></section>`);

  it("keeps a rule for something on the stage and drops one for the page around it", () => {
    expect(ruleReaches(".font-semibold", stage())).toBe(true);
    expect(ruleReaches(".navbar .font-bold", stage())).toBe(false);
  });

  it("keeps the stage's own rules even when nothing matches them yet", () => {
    // Which scene is on changes from frame to frame: a rule that matches nothing now may match a second in.
    expect(ruleReaches(".wr-scene[data-on] .wr-late", stage())).toBe(true);
  });

  it("tests a pseudo-element's rule by the element it hangs on", () => {
    expect(ruleReaches(".font-semibold::after", stage())).toBe(true);
    expect(ruleReaches("*, ::before, ::after", stage())).toBe(true);
    expect(ruleReaches(".navbar::before", stage())).toBe(false);
  });

  it("keeps the rules on the page's root, where the theme's variables live", () => {
    expect(ruleReaches(":root", stage())).toBe(true);
  });

  it("drops a selector the browser cannot read instead of failing the video", () => {
    expect(ruleReaches(".a:unheard-of(", stage())).toBe(false);
  });
});

describe("frameMarkup", () => {
  it("carries only the scenes that are on, at full size", () => {
    const stage = stageWith(
      `<div class="wr-light"></div>` +
        `<section class="wr-scene" data-wr-scene="total" data-on="">949</section>` +
        `<section class="wr-scene" data-wr-scene="streak">41 days</section>`,
    );
    const markup = frameMarkup(stage, "line-height:1.5", new Map());

    expect(markup).toContain("949");
    expect(markup).toContain("wr-light");
    expect(markup).not.toContain("41 days");
    expect(markup).toContain("transform: none");
    expect(markup).toContain("line-height: 1.5");
    // The page's own stage is left as it was: still scaled to fit its frame.
    expect(stage.style.transform).toBe("scale(0.4)");
  });

  it("swaps a picture for its inlined copy and leaves out one it could not read", () => {
    const stage = stageWith(
      `<div class="wr-chrome"><img src="https://avatars.example/ada.png" alt=""><img src="https://avatars.example/blocked.png" alt=""></div>`,
    );
    const markup = frameMarkup(stage, "", new Map([["https://avatars.example/ada.png", "data:image/png;base64,AAAA"]]));

    expect(markup).toContain("data:image/png;base64,AAAA");
    // A picture cannot fetch anything: an address left in it would be a hole in the frame.
    expect(markup).not.toContain("avatars.example");
  });
});
