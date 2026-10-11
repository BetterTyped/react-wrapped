import { createFileRoute } from "@tanstack/react-router";

import { DemoStage, LookControls } from "../../components/preview";
import { SiteFrame } from "../../components/shell";
import { SiteLink } from "../../components/site-link";
import { CHART_EXAMPLES } from "../../registry/charts";
import { TRANSITIONS } from "../../registry/transitions";
import { seoHead } from "../../seo/head";

export const Route = createFileRoute("/designs/")({
  head: () =>
    seoHead({
      title: "Designs: every chart and transition",
      description:
        "Every react-wrapped chart and transition on one page, playing live. Switch the palette, dark or light, and the format, and all of them follow.",
      path: "/designs/",
      crumbs: [
        { label: "Home", path: "/" },
        { label: "Designs", path: "/designs/" },
      ],
    }),
  component: Designs,
});

function Designs() {
  return (
    <SiteFrame>
      <section className="d-plain d-plain-wide">
        <h1>Designs</h1>
        <p className="d-lead">
          Everything the library draws, playing live on one page. Pick a palette, dark or light, and a format: every
          tile follows.
        </p>
        <div className="d-look-row">
          <LookControls />
        </div>

        <h2 id="transitions">
          Transitions <small>{TRANSITIONS.length}</small>
        </h2>
        <ul className="d-shelf">
          {TRANSITIONS.map((transition) => (
            <li key={transition.id}>
              <SiteLink path={`/docs/transitions/${transition.id}/`}>
                <DemoStage demo={{ type: "transition", id: transition.id }} max={420} />
                <strong>{transition.name}</strong>
              </SiteLink>
            </li>
          ))}
        </ul>

        <h2 id="charts">
          Charts <small>{CHART_EXAMPLES.length}</small>
        </h2>
        <ul className="d-shelf">
          {CHART_EXAMPLES.map((example) => (
            <li key={example.name}>
              <SiteLink path={`/docs/charts/${example.chart.type}/`}>
                <DemoStage demo={{ type: "chart", example: example.name }} max={420} />
                <strong>{example.name}</strong>
                <span>{example.says}</span>
              </SiteLink>
            </li>
          ))}
        </ul>
      </section>
    </SiteFrame>
  );
}
