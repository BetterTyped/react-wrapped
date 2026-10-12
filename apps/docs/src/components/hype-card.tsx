import { useEffect, useState } from "react";

import { hypeStack, SITE } from "../site";

/*
 * The card that sends a reader on to Hype Stack. The library is a free tool from it, and this is where every page
 * says so out loud: beside a docs page on a wide screen, and in the corner of the window everywhere else.
 */

const NAME = "Build your SaaS on Hype Stack";

const POINTS = ["Full-stack TypeScript", "Copy, paste, customize", "Save 100+ hours of development"] as const;

/**
 * What both cards hold. The picture is apps built on Hype Stack and the words are its own pitch; the layout is the one its first
 * sidebar offer had: a small lit label, a headline that ends on the name in its colour, one line of why, three
 * short points, the price, and a button the full width of the card.
 */
function Pitch() {
  return (
    <>
      <span className="d-ad-art" aria-hidden>
        <img src={`${SITE.base}hype-stack-apps.jpg`} alt="" width={720} height={400} loading="lazy" />
      </span>
      <span className="d-ad-label">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
        </svg>
        From Hype Stack
      </span>
      <strong>
        Build your SaaS on <b>Hype Stack</b>
      </strong>
      <span className="d-ad-text">
        Free React and Hono template. One CLI command writes auth, billing and teams into your own repo.
      </span>
      <span className="d-ad-points">
        {POINTS.map((point) => (
          <span key={point}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
            </svg>
            {point}
          </span>
        ))}
      </span>
      <span className="d-ad-price">
        <b>Free</b> MIT template
      </span>
      <span className="d-ad-go">
        Explore the stack
        <i aria-hidden>›</i>
      </span>
      <small>Paid packs optional.</small>
    </>
  );
}

/** The card in the column beside a docs page. */
export function HypeStackCard() {
  return (
    <a className="d-ad" href={hypeStack("docs-sidebar")} target="_blank" rel="noopener" aria-label={NAME}>
      <Pitch />
    </a>
  );
}

/** Closed for this visit: the card stays away until the tab is closed, and comes back the next time. */
const CLOSED = "react-wrapped:docs:hype-card";

/**
 * The same card pinned to the corner of the window, for every page that has no column to put it in. It can be
 * closed, and it is drawn only once the page runs, so someone who closed it never sees it flash back.
 */
export function HypeStackFloat() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    try {
      setShown(window.sessionStorage.getItem(CLOSED) === null);
    } catch {
      // Blocked storage: the card shows, and closing it lasts for this page.
      setShown(true);
    }
  }, []);
  if (!shown) return null;
  const close = () => {
    setShown(false);
    try {
      window.sessionStorage.setItem(CLOSED, "1");
    } catch {
      // Blocked storage: closed for this page only.
    }
  };
  return (
    <aside className="d-float" aria-label="From Hype Stack">
      <a className="d-ad" href={hypeStack("docs-float")} target="_blank" rel="noopener" aria-label={NAME}>
        <Pitch />
      </a>
      <button type="button" className="d-float-close" onClick={close} aria-label="Close the Hype Stack card">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
