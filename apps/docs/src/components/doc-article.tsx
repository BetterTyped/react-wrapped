import { useEffect, useState } from "react";

import { anchorOf, type DocPage } from "../content/types";
import { neighboursOf, SECTIONS, titleOf } from "../registry/pages";
import { absoluteUrl } from "../site";
import { Blocks } from "./blocks";
import { Inline } from "./inline";
import { SiteLink } from "./site-link";

/** The trail from the home page down to a docs page, the page itself last. */
export function crumbsOf(page: DocPage) {
  const section = SECTIONS.find((entry) => entry.id === page.section);
  const overview = section?.pages[0];
  return [
    { label: "Docs", path: "/docs/" },
    ...(overview && overview.path !== page.path && overview.path !== "/docs/"
      ? [{ label: section.title, path: overview.path }]
      : []),
    ...(page.path === "/docs/" ? [] : [{ label: page.title, path: page.path }]),
  ];
}

/**
 * Which heading the reader is at: the last one that has passed the top of the window. The list beside the page
 * lights that entry, so a long page always says where in it you are.
 */
function useHeadingInView(headings: readonly string[]) {
  const [current, setCurrent] = useState<string | null>(null);
  // The list is made afresh on every render; its anchors as one string only change when the page does.
  const anchors = headings.map(anchorOf).join(" ");
  useEffect(() => {
    const nodes = anchors.split(" ").flatMap((anchor) => document.getElementById(anchor) ?? []);
    if (nodes.length === 0) return;
    const read = () => {
      const passed = nodes.filter((node) => node.getBoundingClientRect().top < 140);
      setCurrent(passed.at(-1)?.id ?? null);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [anchors]);
  return current;
}

/** The list of a page's headings, beside it on a wide screen. */
function Contents({ headings }: { headings: readonly string[] }) {
  const current = useHeadingInView(headings);
  return (
    <aside className="d-toc" aria-label="On this page">
      <h2>On this page</h2>
      <ul>
        {headings.map((heading) => (
          <li key={heading}>
            <a href={`#${anchorOf(heading)}`} aria-current={current === anchorOf(heading) ? "location" : undefined}>
              {heading}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** One page of the docs: its trail, its title, what it is, its blocks, where to go next. */
export function DocArticle({ page }: { page: DocPage }) {
  const crumbs = crumbsOf(page);
  const headings = page.blocks.flatMap((block) => (block.kind === "h2" ? [block.text] : []));
  const { previous, next } = neighboursOf(page.path);
  const related = page.related.flatMap((path) => {
    const title = titleOf(path);
    return title ? [{ path, title }] : [];
  });
  return (
    <div className="d-article-grid">
      <article className="d-article">
        <nav aria-label="Breadcrumb" className="d-crumbs">
          <ol>
            {crumbs.map((crumb, index) => (
              <li key={crumb.path}>
                {index === crumbs.length - 1 ? (
                  <span aria-current="page">{crumb.label}</span>
                ) : (
                  <SiteLink path={crumb.path}>{crumb.label}</SiteLink>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1>{page.title}</h1>
        <p className="d-lead">
          <Inline text={page.lead} />
        </p>
        <Blocks blocks={page.blocks} />
        {related.length > 0 ? (
          <>
            <h2 id="related">Related</h2>
            <ul className="d-related">
              {related.map((entry) => (
                <li key={entry.path}>
                  <SiteLink path={entry.path}>{entry.title}</SiteLink>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <nav className="d-pager" aria-label="Previous and next page">
          {previous ? (
            <SiteLink path={previous.path} rel="prev" data-glow>
              <small>Previous</small>
              {previous.title}
            </SiteLink>
          ) : (
            <span />
          )}
          {next ? (
            <SiteLink path={next.path} rel="next" data-glow>
              <small>Next</small>
              {next.title}
            </SiteLink>
          ) : null}
        </nav>
        <p className="d-meta">
          Last updated <time dateTime={page.updated}>{page.updated}</time>.{" "}
          <a href={absoluteUrl(`${page.path}index.md`)}>Read this page as Markdown</a>.
        </p>
      </article>
      {headings.length > 1 ? <Contents headings={headings} /> : null}
    </div>
  );
}
