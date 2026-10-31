import { type RefObject, useEffect, useState } from "react";

/*
 * Live stages that wait their turn. A stage builds its scene's timelines the moment it mounts, and a page of them
 * mounting together holds the page still for most of a second, right while the hero plays in. So a stage mounts
 * when it nears the window, one per frame, in the order the page asks for. Everything else mounts one at a time
 * while the browser is idle, once the first screen has settled.
 */

interface Turn {
  run: () => void;
  /** Lower goes first among the stages in sight: the hero's player before the cards beside it. */
  order: number;
}

/** In sight or about to be: one per frame. */
const soon: Turn[] = [];
/** Further down the page: one per idle moment, once the first screen has played in. */
const later: Turn[] = [];
let framing = false;
let idling = false;

/** How long the first screen has to itself before anything off screen is built. */
const SETTLE = 1800;
/** How close to the window a stage is when it counts as in sight. */
const NEAR = "240px 0px";

function nextFrame() {
  if (framing) return;
  framing = true;
  requestAnimationFrame(() => {
    framing = false;
    soon.shift()?.run();
    if (soon.length > 0) nextFrame();
  });
}

const whenIdle = (work: (deadline?: IdleDeadline) => void) =>
  typeof requestIdleCallback === "function" ? requestIdleCallback(work, { timeout: 1000 }) : setTimeout(work, 60);

function nextIdle() {
  if (idling) return;
  idling = true;
  const wait = Math.max(0, SETTLE - performance.now());
  setTimeout(
    () =>
      whenIdle((deadline) => {
        idling = false;
        // Nothing waits for an idle moment while something in sight is still to be built.
        if (soon.length === 0) {
          do later.shift()?.run();
          while (later.length > 0 && (deadline?.timeRemaining() ?? 0) > 24);
        }
        if (later.length > 0) nextIdle();
      }),
    wait,
  );
}

const drop = (queue: Turn[], turn: Turn) => {
  const index = queue.indexOf(turn);
  if (index !== -1) queue.splice(index, 1);
};

/**
 * Whether the element's stage may mount yet. False on the server and on the first paint, so the page hydrates
 * without building a single timeline. `idle: false` keeps a stage waiting until it is in sight, for one that may
 * never be shown at all (hidden on a narrow screen).
 */
export function useTurn(ref: RefObject<Element | null>, { order = 10, idle = true } = {}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const turn: Turn = {
      order,
      run: () => {
        observer.disconnect();
        setOn(true);
      },
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        drop(later, turn);
        if (soon.includes(turn)) return;
        const at = soon.findIndex((other) => other.order > order);
        soon.splice(at === -1 ? soon.length : at, 0, turn);
        nextFrame();
      },
      { rootMargin: NEAR },
    );
    observer.observe(node);
    if (idle) {
      later.push(turn);
      nextIdle();
    }
    return () => {
      observer.disconnect();
      drop(soon, turn);
      drop(later, turn);
    };
  }, [ref, order, idle]);
  return on;
}
