import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SiteFrame } from "../../../components/shell";
import { SiteLink } from "../../../components/site-link";
import { FromParts } from "../../../examples/from-parts";
import { seoHead } from "../../../seo/head";

export const Route = createFileRoute("/examples/from-parts/")({
  head: () =>
    seoHead({
      title: "From parts example: no WrappedView",
      description:
        "The full Wrapped page rebuilt by hand from the single react-wrapped packages: player, settings, scan, scene editor and gallery, wired without the kit.",
      path: "/examples/from-parts/",
      crumbs: [
        { label: "Home", path: "/" },
        { label: "From parts example", path: "/examples/from-parts/" },
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
        <h1>From parts example</h1>
        <p className="d-lead">
          The same year as the full Wrapped example, on a page put together by hand. There is no{" "}
          <code>WrappedView</code> here and nothing is imported from the kit: the player, the settings, the scan, the
          scene editor and the gallery each come from their own package, and this page does the wiring between them.
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
      </section>
      {/* The example stands on the page itself, outside the site's own panels, the way it would in an app. */}
      <div className="d-example">
        <FromParts key={gate ? "gate" : "play"} gate={gate} />
      </div>
      <section className="d-plain d-plain-wide">
        <p>
          <SiteLink path="/docs/guides/from-parts/">Build the page from parts</SiteLink> walks through this file piece
          by piece. The same page from one component is the{" "}
          <SiteLink path="/examples/full-wrapped/">full Wrapped example</SiteLink>.
        </p>
      </section>
    </SiteFrame>
  );
}
