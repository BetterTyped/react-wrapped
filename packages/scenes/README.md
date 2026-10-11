# @react-wrapped/scenes

Eleven ready-made scenes for year in review videos in React.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

Opening, big number, biggest day, bars, chart, list, split, fact, persona, summary and trophies. Call one with what it
should say and a key, and it is a scene the stage can play.

## Install

```bash
pnpm add @react-wrapped/scenes @react-wrapped/charts @react-wrapped/core gsap
```

GSAP is a peer dependency: you install it yourself. Every `@react-wrapped` package is released under one version number,
so install them all at the same version.

## Use

```tsx
import { chartScene } from "@react-wrapped/scenes";

export const scene = chartScene(
  {
    eyebrow: "Your year",
    title: ["Then came", "*launch week.*"],
    lede: "The busiest stretch, lit.",
    chart: { type: "spark", values: [4, 9, 6, 14, 22, 31, 18, 12], band: { from: 4, to: 5, label: "Launch week" } },
  },
  { key: "launch", label: "Launch week" },
);
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
