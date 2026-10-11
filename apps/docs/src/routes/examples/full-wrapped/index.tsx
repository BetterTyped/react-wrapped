import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SiteFrame } from "../../../components/shell";
import { SiteLink } from "../../../components/site-link";
import { FullWrapped } from "../../../examples/full-wrapped";
import { seoHead } from "../../../seo/head";

export const Route = createFileRoute("/examples/full-wrapped/")({
  head: () =>
    seoHead({
      title: "Full Wrapped example: one component",
      description:
        "A complete year in review built with react-wrapped: the player, settings, a scan that finds hidden scenes, an editable timeline and graphics to keep.",
      path: "/examples/full-wrapped/",
      crumbs: [
        { label: "Home", path: "/" },
        { label: "Full Wrapped example", path: "/examples/full-wrapped/" },
      ],
    }),
  component: Example,
});

function Example() {
  // Someone's own year opens on its scan. The switch shows that start; the default plays right away.
  const [gate, setGate] = useState(false);
  return (
    <SiteFrame>
      <section className="d-plain d-plain-wide">
        <h1>Full Wrapped example</h1>
        <p className="d-lead">
          A whole year in review from one component: a made-up developer, ada, and her year on a made-up platform. Play
          it, change the palette and the format, run the scan under the video to find four hidden scenes, edit a scene
          from the timeline, and download a card.
        </p>
        <div className="d-look-row">
          <div role="group" aria-label="How the page starts" className="d-look-chips">
            <button type="button" aria-pressed={!gate} onClick={() => setGate(false)}>
              Play right away
            </button>
            <button type="button" aria-pressed={gate} onClick={() => setGate(true)}>
              Start from the scan
            </button>
          </div>
        </div>
        <div className="d-example">
          <FullWrapped key={gate ? "gate" : "play"} gate={gate} />
        </div>
        <p>
          Every part of this page is exported on its own. See the <SiteLink path="/docs/charts/">charts</SiteLink>, the{" "}
          <SiteLink path="/docs/transitions/">transitions</SiteLink> and{" "}
          <SiteLink path="/designs/">every design on one page</SiteLink>.
        </p>
      </section>
    </SiteFrame>
  );
}
