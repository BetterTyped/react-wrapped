# @react-wrapped/graphics

Graphics to keep from a react-wrapped video: the share card, insight cards, the gallery.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

`renderShareCard` draws a year on one card as a PNG. `InsightCard` and `renderInsightCard` make a card per insight, with
the same chart the video plays. `GraphicsGallery` lays them out with download buttons, and keeps the ones not found yet
locked.

## Install

```bash
pnpm add @react-wrapped/graphics @react-wrapped/charts @react-wrapped/core gsap
```

GSAP is a peer dependency: you install it yourself. Every `@react-wrapped` package is released under one version number,
so install them all at the same version.

## Use

```tsx
import { resolvePalette, DEFAULT_WRAPPED_CONFIG } from "@react-wrapped/core";
import { renderInsightCard } from "@react-wrapped/graphics";

const png = await renderInsightCard(
  {
    handle: "ada",
    caption: "Orbit Wrapped, 2026",
    name: "Friday Shipper",
    stat: { value: "19%", label: "of your work landed on a Friday" },
    insight: "Every Friday of your year. The lit ones are the Fridays you shipped.",
    chart: { type: "meter", pills: [3, 0, 5, 2, 0, 4], from: "Jan", to: "Dec" },
  },
  resolvePalette(DEFAULT_WRAPPED_CONFIG),
);
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
