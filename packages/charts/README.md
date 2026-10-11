# @react-wrapped/charts

Twenty-one animated charts for year in review videos in React.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

A chart is data a scene hands over: `{ type: "spark", values }`. Each of the twenty-one draws itself in the palette of
the stage it is on and plays its own entrance on the scene's GSAP timeline, so it seeks and exports like everything
else.

## Install

```bash
pnpm add @react-wrapped/charts @react-wrapped/core gsap
```

GSAP is a peer dependency: you install it yourself. Every `@react-wrapped` package is released under one version number,
so install them all at the same version.

## Use

```tsx
import { Chart, type SceneChart } from "@react-wrapped/charts";

const chart: SceneChart = {
  type: "bars",
  bars: [62, 88, 54, 96, 71, 22, 30].map((value, index) => ({ label: "MTWTFSS"[index], value, peak: index > 4 })),
};

// Inside a scene's render:
<Chart chart={chart} />;
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/charts/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
