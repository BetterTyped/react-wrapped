import { useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useId, useState } from "react";

import { SECTIONS } from "../registry/pages";
import { hypeStack, SITE } from "../site";
import { Search } from "./search";
import { SiteLink } from "./site-link";

/*
 * The chrome around every page: the bar on top, the docs sidebar, the footer. Plain markup and the site's own
 * stylesheet (`styles/docs.css`); nothing here comes from the library.
 */

/** Where the reader is, as a site path: the router's own path with the site's base taken off the front. */
export function useSitePath() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const bare = pathname.startsWith(SITE.base) ? pathname.slice(SITE.base.length - 1) : pathname;
  return bare.endsWith("/") ? bare : `${bare}/`;
}

/**
 * Runs before the first paint: the page opens in the mode it was left in, or the system's, with no flash of the
 * other one. Kept as a string because it has to be in the HTML ahead of everything else.
 */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("react-wrapped:docs:theme");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("react-wrapped:docs:theme", next ? "dark" : "light");
    } catch {
      // Blocked storage: the mode lasts for this page.
    }
  };
  return (
    <button
      type="button"
      className="d-icon-button"
      onClick={flip}
      aria-label={dark ? "Use light mode" : "Use dark mode"}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        {dark ? (
          <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}

/**
 * The mark: a W drawn the way the library draws a chart, a glowing line that ends on its lit point, on a piece of
 * the stage. Each one on a page needs its own gradient id, so the id is made here.
 */
export function Mark({ className = "d-mark" }: { className?: string }) {
  const light = useId();
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <radialGradient id={light} cx="0.2" cy="0.05" r="0.9">
          <stop offset="0" stopColor="#1f7a3d" stopOpacity="0.75" />
          <stop offset="0.6" stopColor="#1f7a3d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0d1117" />
      <rect width="64" height="64" rx="15" fill={`url(#${light})`} />
      <path
        d="M11.5 21.5 21.5 44.5 32 25.5 42.5 44.5 52.5 19.5"
        fill="none"
        stroke="#39d353"
        strokeWidth="6.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="52.5" cy="19.5" r="7.2" fill="#d2f26b" stroke="#0d1117" strokeWidth="2.6" />
    </svg>
  );
}

function Navbar({ onMenu }: { onMenu: () => void }) {
  const path = useSitePath();
  // One entry of the bar is lit at a time: a section with a link of its own, or the docs as a whole.
  const section = path.startsWith("/docs/charts/")
    ? "charts"
    : path.startsWith("/docs/transitions/")
      ? "transitions"
      : path.startsWith("/docs/")
        ? "docs"
        : null;
  return (
    <header className="d-bar">
      <div className="d-bar-inner">
        <button type="button" className="d-icon-button d-menu-button" onClick={onMenu} aria-label="Open the docs menu">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <SiteLink path="/" className="d-brand" aria-label={`${SITE.title} home`}>
          <Mark />
          <span>
            react<b>-</b>wrapped
          </span>
        </SiteLink>
        <nav aria-label="Site">
          <SiteLink path="/docs/" aria-current={section === "docs" ? "page" : undefined}>
            Docs
          </SiteLink>
          <SiteLink
            path="/docs/charts/"
            className="d-bar-wide"
            aria-current={section === "charts" ? "page" : undefined}
          >
            Charts
          </SiteLink>
          <SiteLink
            path="/docs/transitions/"
            className="d-bar-wide"
            aria-current={section === "transitions" ? "page" : undefined}
          >
            Transitions
          </SiteLink>
          <SiteLink path="/designs/" aria-current={path === "/designs/" ? "page" : undefined}>
            Designs
          </SiteLink>
        </nav>
        <div className="d-bar-end">
          <Search />
          <a
            className="d-icon-button"
            href={SITE.repo}
            target="_blank"
            rel="noreferrer"
            aria-label="react-wrapped on GitHub"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="d-fill">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.18-.02-2.14-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.33.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.19-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
          </a>
          <ThemeToggle />
          <a className="d-pill d-pill-brand" href={hypeStack("docs-navbar")} target="_blank" rel="noopener">
            Hype Stack
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ onPick }: { onPick?: () => void }) {
  const path = useSitePath();
  return (
    <nav className="d-side" aria-label="Docs">
      {SECTIONS.map((section) => (
        <section key={section.id}>
          <h2>{section.title}</h2>
          <ul>
            {section.pages.map((page) => (
              <li key={page.path}>
                <SiteLink path={page.path} aria-current={page.path === path ? "page" : undefined} onClick={onPick}>
                  {page.nav}
                </SiteLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="d-foot">
      <div className="d-foot-inner">
        <p>
          A free tool from{" "}
          <a href={hypeStack("docs-footer")} target="_blank" rel="noopener">
            Hype Stack
          </a>
          , the full stack React template. Made by{" "}
          <a href={SITE.organization.url} target="_blank" rel="noreferrer">
            BetterTyped
          </a>
          . MIT licensed.
        </p>
        <nav aria-label="Elsewhere">
          <a href={hypeStack("docs-footer", "/wrapped")} target="_blank" rel="noopener">
            See it live
          </a>
          <a href={SITE.repo} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={SITE.discord} target="_blank" rel="noreferrer">
            Discord
          </a>
          <a href={SITE.x} target="_blank" rel="noreferrer">
            X
          </a>
          <a href={SITE.sponsor} target="_blank" rel="noreferrer">
            Sponsor
          </a>
        </nav>
      </div>
    </footer>
  );
}

/** The bar with the docs menu behind its button: on a phone that drawer is the only way around the site. */
function Chrome({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useSitePath();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <>
      <a className="d-skip" href="#content">
        Skip to content
      </a>
      <Navbar onMenu={() => setOpen(true)} />
      {children}
      {open ? (
        <div className="d-drawer" role="dialog" aria-modal="true" aria-label="Docs menu">
          <button type="button" className="d-drawer-shade" aria-label="Close the menu" onClick={() => setOpen(false)} />
          <div className="d-drawer-panel">
            <Sidebar onPick={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
      <Footer />
    </>
  );
}

/** A page outside the docs: the bar, the page, the footer. */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <Chrome>
      <main id="content">{children}</main>
    </Chrome>
  );
}

/** A docs page: the same, with the sidebar beside it. On a phone the sidebar is the drawer behind the menu button. */
export function DocsFrame({ children }: { children: ReactNode }) {
  return (
    <Chrome>
      <div className="d-docs">
        <div className="d-side-rail">
          <Sidebar />
        </div>
        <main id="content" className="d-docs-main">
          {children}
        </main>
      </div>
    </Chrome>
  );
}
