import { gsap } from "gsap";
import type { CSSProperties } from "react";

import {
  countUp,
  defineScene,
  EASE_OUT,
  hold,
  Lines,
  linesField,
  linesIn,
  rich,
  riseIn,
  setText,
  textField,
} from "@react-wrapped/core";

// Sizes are in the frame's own pixels: the stage is 1080 wide and is scaled as a whole to fit the page.
const TRACK: CSSProperties = {
  width: "100%",
  height: 28,
  margin: "56px 0 20px",
  overflow: "hidden",
  borderRadius: 14,
  background: "var(--wr-l1)",
};
const FILL: CSSProperties = { display: "block", height: "100%", borderRadius: 14, background: "var(--wr-l4)" };
const COUNT: CSSProperties = { marginBottom: 44, fontSize: 36, fontWeight: 600, color: "var(--wr-muted)" };

const percentOf = (reached: number, goal: number) => Math.round((reached / Math.max(1, goal)) * 100);

/** A goal and how far the year got: the percentage counts up while a bar fills to the same mark. */
export const goalScene = defineScene<{
  eyebrow: string;
  title: readonly string[];
  reached: number;
  goal: number;
  /** What is counted: "days", "books". */
  unit: string;
  lede: string;
}>({
  // The texts a viewer may rewrite from the scene editor. The numbers stay yours.
  fields: [textField("eyebrow", "Line above"), linesField("title", "Headline"), textField("lede", "Line under it")],
  render: ({ eyebrow, title, reached, goal, unit, lede }) => (
    <>
      <p className="wr-eyebrow">{rich(eyebrow)}</p>
      {/* `countUp` reads where to stop from `data-count` and what to put after the number from `data-suffix`. */}
      <div className="wr-mega" data-count={percentOf(reached, goal)} data-suffix="%">
        0%
      </div>
      <Lines lines={title} />
      <div style={TRACK}>
        <i data-goal-fill style={{ ...FILL, width: `${Math.min(100, percentOf(reached, goal))}%` }} />
      </div>
      {/* Rendered finished: a still of the scene (the timeline's hover preview) shows the markup as it stands. */}
      <p data-goal-count style={COUNT}>{`${reached} of ${goal} ${unit}`}</p>
      <p className="wr-lede">{rich(lede)}</p>
    </>
  ),
  animate: ({ root }, { reached, goal, unit }) => {
    const tl = gsap.timeline();
    // Query inside `root` only: every scene of the video is mounted on the same stage.
    const count = root.querySelector("[data-goal-count]");
    const done = { value: 0 };

    riseIn(tl, root.querySelectorAll(".wr-eyebrow, .wr-mega"), { at: 0 });
    countUp(tl, root.querySelector(".wr-mega"), { at: 0.2, duration: 1.6 });
    linesIn(tl, root, { at: 0.35 });
    tl.from(
      root.querySelector("[data-goal-fill]"),
      { scaleX: 0, transformOrigin: "left center", duration: 1.6, ease: EASE_OUT },
      0.2,
    );
    riseIn(tl, count, { at: 0.2 });
    // A tween on a plain object, so the count is on the timeline too and seeks with everything else.
    tl.to(
      done,
      {
        value: reached,
        duration: 1.6,
        ease: "power3.out",
        onUpdate: () => {
          if (count) setText(count, `${Math.round(done.value)} of ${goal} ${unit}`);
        },
      },
      0.2,
    );
    riseIn(tl, root.querySelector(".wr-lede"), { at: 1.2 });
    // The scene ends on a pause for reading. It never takes itself out: the transition does that.
    hold(tl, 1.4);
    return tl;
  },
});
