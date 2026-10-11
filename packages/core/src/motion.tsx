import type { ReactNode } from "react";

import type { Rng } from "./rng";
import type { SceneContext, SceneInstance } from "./types";

/*
 * The motion vocabulary every scene shares. Scenes describe what comes in and
 * in which order; these helpers decide how it moves, so thirty scenes across
 * ten sources still feel like one piece.
 */

export const EASE_OUT = "expo.out";

/** Heading lines rising out of their own mask. */
export function linesIn(
  tl: gsap.core.Timeline,
  root: HTMLElement,
  { at, stagger = 0.09 }: { at: number; stagger?: number },
) {
  const lines = root.querySelectorAll(".wr-line > span");
  if (lines.length === 0) return;
  // 135, not just past 100: the mask reaches a little below the line so descenders are not shaved, and a line that
  // starts right under its own box would show its accents through that margin.
  tl.from(lines, { yPercent: 135, rotate: 2.5, duration: 1.05, ease: EASE_OUT, stagger }, at);
}

/** Supporting text and objects, softly: up, in, out of focus. */
export function riseIn(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  { at, stagger = 0.12 }: { at: number; stagger?: number },
) {
  tl.from(targets, { y: 50, autoAlpha: 0, filter: "blur(12px)", duration: 0.9, ease: EASE_OUT, stagger }, at);
}

/**
 * Counts an element up to its `data-count`, with `data-suffix` after it. Two
 * styles: a smooth climb, or digits that scramble and lock in left to right
 * like a slot machine.
 */
export function countUp(
  tl: gsap.core.Timeline,
  element: Element | null,
  { at, duration = 1.6, style = "climb" }: { at: number; duration?: number; style?: "climb" | "slot" },
) {
  if (!(element instanceof HTMLElement)) return;
  const node = element;
  const target = Number(node.dataset.count ?? 0);
  const suffix = node.dataset.suffix ?? "";
  // A count like 69.9 (millions, with an "M" suffix) climbs with its decimal; whole counts climb through whole numbers.
  const decimals = (String(target).split(".")[1] ?? "").length;
  const format = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const final = format(target);
  const box = { value: 0 };

  if (style === "climb") {
    tl.to(
      box,
      {
        value: target,
        duration,
        ease: "power3.out",
        onUpdate: () => {
          setText(node, format(box.value) + suffix);
        },
      },
      at,
    );
    return;
  }

  // Slot: each digit spins, then locks in place, left to right. Seeded by position, so a replay is identical.
  tl.to(
    box,
    {
      value: 1,
      duration,
      ease: "none",
      onUpdate: () => {
        const locked = Math.floor(box.value * (final.length + 1));
        setText(
          node,
          [...final]
            .map((char, index) =>
              index < locked || !/\d/.test(char) ? char : String((index * 7 + Math.floor(box.value * 60)) % 10),
            )
            .join("") + suffix,
        );
      },
    },
    at,
  );
}

/**
 * Changes an element's text without swapping its text node. `textContent = ...`
 * inserts a new node, and the site's `:has()` rules on <html> and <main> answer
 * any insertion by restyling the whole page: every frame of a counter, thousands
 * of elements. Editing the node in place is a text change, which they ignore.
 */
export function setText(element: Element, text: string) {
  const node = element.firstChild;
  if (node && node.nodeType === Node.TEXT_NODE && !node.nextSibling) {
    if (node.nodeValue !== text) node.nodeValue = text;
    return;
  }
  const target = element;
  if (target.textContent !== text) target.textContent = text;
}

/** A pause where the viewer reads. Every scene ends on one before the engine takes it out. */
export const hold = (tl: gsap.core.Timeline, seconds: number) => tl.to({}, { duration: seconds });

/** How fast text on a screen is read: about 240 words a minute. */
const WORDS_PER_SECOND = 4;
/** Reading starts a beat after the scene does: its text is still on the way in. */
const READ_LEAD = 0.8;

/**
 * How much there is to read in a scene, in words, given every run of text it shows. A sentence counts in full. A
 * word or a number standing alone ("Legendary", "1,107") is taken in at a glance, and an axis tick ("Oct", "M")
 * hardly at all: thirteen month names under a chart are not thirteen words of reading.
 */
export function wordsToRead(texts: readonly string[]): number {
  return texts.reduce((sum, text) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return sum;
    if (words.length > 1) return sum + words.length;
    return sum + (words[0].length <= 3 ? 0.1 : 0.6);
  }, 0);
}

/** The seconds something has to stay up for all of its text to be read. */
export const readingSeconds = (texts: readonly string[]) => READ_LEAD + wordsToRead(texts) / WORDS_PER_SECOND;

/** Every run of text under an element, charts included. */
/** A scene is never shrunk past this: below it the type stops being readable in a feed. */
const SMALLEST_FIT = 0.6;

/**
 * Makes a scene fit its frame. Scenes are drawn for the tall format; in the square and the wide one the room
 * between the header row and the footer is much shorter, and a list, a chart or a full card ran under both.
 * What does not fit is shrunk as a whole (its type, its gaps and its pictures together) until it does. A scene
 * that fits is left exactly as it was drawn. The scene has to be in layout when this runs.
 */
export function fitScene(root: HTMLElement) {
  const parts = [...root.children].filter(
    (part): part is HTMLElement => part instanceof HTMLElement && getComputedStyle(part).position !== "absolute",
  );
  for (const part of parts) part.style.removeProperty("--wr-fit");
  if (parts.length === 0) return;
  const style = getComputedStyle(root);
  const room = root.clientHeight - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom);
  // Margins count: the scene centres its content margins and all, so a part with more margin under it than over
  // it sits high, and a block that fits without them can still reach over the header.
  const edges = parts.map((part) => {
    const margins = getComputedStyle(part);
    return {
      top: part.offsetTop - Number.parseFloat(margins.marginTop),
      bottom: part.offsetTop + part.offsetHeight + Number.parseFloat(margins.marginBottom),
    };
  });
  const tall = Math.max(...edges.map((edge) => edge.bottom)) - Math.min(...edges.map((edge) => edge.top));
  if (room <= 0 || tall <= room + 1) return;
  const fit = Math.max(SMALLEST_FIT, room / tall);
  // The size itself is the stylesheet's business (`zoom: var(--wr-fit)` on a scene's parts); this only says how much.
  for (const part of parts) part.style.setProperty("--wr-fit", fit.toFixed(3));
}

function textsIn(root: HTMLElement): string[] {
  const texts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) texts.push(node.nodeValue ?? "");
  return texts;
}

/* ---------- text ---------- */

/**
 * Scene text is plain strings with two marks, so people can edit it without an
 * editor: *accent* turns the words the palette's accent colour, **bold** makes
 * them bold and full strength.
 */
export function rich(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    // oxlint-disable-next-line react/no-array-index-key -- fragments of one string, positional
    if (part.startsWith("**") && part.endsWith("**")) return <b key={index}>{part.slice(2, -2)}</b>;
    // oxlint-disable-next-line react/no-array-index-key -- fragments of one string, positional
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

/** Splits a one-line heading into two balanced lines, at a word. Text with its own line breaks keeps them. */
export function headingLines(text: string): string[] {
  if (text.includes("\n"))
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  // A marked phrase is one token, so "*a lot*" never breaks across lines and loses its stars.
  const words = text.match(/\*\*[^*]+\*\*\S*|\*[^*]+\*\S*|\S+/g) ?? [];
  if (words.length < 2) return [text];
  const imbalance = (cut: number) => Math.abs(words.slice(0, cut).join(" ").length - words.slice(cut).join(" ").length);
  let best = 1;
  for (let cut = 2; cut < words.length; cut++) if (imbalance(cut) < imbalance(best)) best = cut;
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/** A heading split into lines that rise out of their masks. */
export function Lines({ lines, className = "wr-title" }: { lines: readonly string[]; className?: string }) {
  return (
    <h2 className={className}>
      {lines.map((line, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- lines are positional and never reorder
        <span key={index} className="wr-line">
          <span>{rich(line)}</span>
        </span>
      ))}
    </h2>
  );
}

/* ---------- scenes ---------- */

/** One piece of a scene's text a viewer may rewrite. Headings are edited as lines separated by new lines. */
export interface SceneField<P> {
  name: string;
  label: string;
  multiline?: boolean;
  read: (props: P) => string;
  write: (props: P, value: string) => P;
}

interface SceneSpec<P> {
  /** Center the scene's content instead of starting it on the left. */
  align?: "start" | "center";
  /** The texts the scene editor offers for this kind of scene. */
  fields?: readonly SceneField<P>[];
  render: (props: P) => ReactNode;
  /** Brings the scene in and holds it. Never takes it out: the engine owns exits. */
  animate: (context: SceneContext, props: P) => gsap.core.Timeline;
}

/** Field helpers for the props almost every scene has. */
export const textField = <P,>(name: keyof P & string, label: string): SceneField<P> => ({
  name,
  label,
  read: (props) => String(props[name] ?? ""),
  write: (props, value) => ({ ...props, [name]: value }),
});
export const linesField = <P,>(name: keyof P & string, label: string): SceneField<P> => ({
  name,
  label,
  multiline: true,
  read: (props) => (props[name] as readonly string[]).join("\n"),
  write: (props, value) => ({
    ...props,
    [name]: value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  }),
});

/**
 * Declares a scene once; calling the result places it in a cut with its own
 * props. The props stay inside the closure, so a cut can mix any scenes, and
 * `withEdits` re-places it with the viewer's rewritten texts.
 */
export function defineScene<P>(spec: SceneSpec<P>) {
  const place = (
    props: P,
    meta: {
      key: string;
      label: string;
      drop?: SceneInstance["drop"];
      /** A scene that was assigned, not written: nothing on it can be rewritten. */
      locked?: boolean;
    },
  ): SceneInstance => ({
    key: meta.key,
    label: meta.label,
    drop: meta.drop,
    fields: (meta.locked ? [] : (spec.fields ?? [])).map((field) => ({
      name: field.name,
      label: field.label,
      multiline: field.multiline ?? false,
      value: field.read(props),
    })),
    withEdits: (edits) => {
      if (meta.locked) return place(props, meta);
      const edited = (spec.fields ?? []).reduce((current, field) => {
        const value = edits[field.name];
        return value === undefined || value.trim() === "" ? current : field.write(current, value);
      }, props);
      return place(edited, meta);
    },
    signature: JSON.stringify(props),
    content: (
      <section className="wr-scene" data-wr-scene={meta.key} data-align={spec.align ?? "start"}>
        {spec.render(props)}
      </section>
    ),
    animate: (context) => {
      // Before anything measures it: the scene is in layout here, and every tween below reads where things are.
      fitScene(context.root);
      const tl = spec.animate(context, props);
      // A scene stays for as long as its own text takes to read. The hold a scene ends on is only the least it gets:
      // one with a long description or a full list is kept up until that can be read too.
      const short = readingSeconds(textsIn(context.root)) - tl.duration();
      if (short > 0) hold(tl, short);
      return tl;
    },
  });
  return place;
}

/** One of several phrasings, chosen by the seeded source, so the same fact reads differently in two videos. */
export function say(rng: Rng, variants: readonly string[]): string {
  return rng.pick(variants);
}
