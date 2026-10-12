import { useEffect, useState } from "react";

import { hypeStack, SITE } from "../site";

/*
 * The card that sends a reader on to Hype Stack. The library is a free tool from it, and this is where every page
 * says so out loud: beside a docs page on a wide screen, and in the corner of the window everywhere else.
 */

const HEADLINE = "Build your SaaS on Hype Stack";
const TEXT = "Free React and Hono template. One CLI command writes auth, billing and teams into your own repo.";
const ACTION = "Explore the stack";

function Art() {
  return (
    <span className="d-ad-art" aria-hidden>
      <img src={`${SITE.base}hype-stack.png`} alt="" width={56} height={56} loading="lazy" />
    </span>
  );
}

/** The card in the column beside a docs page. */
export function HypeStackCard() {
  return (
    <a className="d-ad" href={hypeStack("docs-sidebar")} target="_blank" rel="noopener">
      <Art />
      <span className="d-ad-body">
        <strong>{HEADLINE}</strong>
        <span className="d-ad-text">{TEXT}</span>
        <span className="d-ad-go">{ACTION}</span>
        <small>MIT template. Paid packs optional.</small>
      </span>
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
      <a className="d-ad" href={hypeStack("docs-float")} target="_blank" rel="noopener">
        <Art />
        <span className="d-ad-body">
          <strong>{HEADLINE}</strong>
          <span className="d-ad-text">{TEXT}</span>
          <span className="d-ad-go">{ACTION}</span>
        </span>
      </a>
      <button type="button" className="d-float-close" onClick={close} aria-label="Close the Hype Stack card">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
