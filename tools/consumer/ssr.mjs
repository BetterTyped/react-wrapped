/* oxlint-disable no-console -- prints what it rendered, for the check that runs it */
// A Wrapped rendered to a string by plain Node: what a server does with it before the browser takes over.
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { bigNumberScene, DEFAULT_WRAPPED_CONFIG, WrappedView } from "@react-wrapped/kit";
const scenes = [
  bigNumberScene(
    { eyebrow: "This year", value: 1687, title: ["commits."], lede: "x", counter: "climb", variant: 0 },
    { key: "total", label: "Total" },
  ),
];
const html = renderToString(
  createElement(WrappedView, {
    subject: { handle: "ada", caption: "Orbit Wrapped" },
    seed: "ada",
    scenes,
    config: DEFAULT_WRAPPED_CONFIG,
    onConfigChange: () => {},
  }),
);
console.log(
  "ssr ok:",
  html.length,
  "chars, has stage:",
  html.includes("wr-stage"),
  "has Download:",
  html.includes("Download"),
);
