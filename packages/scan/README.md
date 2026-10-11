# @react-wrapped/scan

The year scan for react-wrapped: a beam sweeps the year and finds the scenes hidden in it.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

`YearScan` shows a year as a blank grid. A beam sweeps it, locks onto a day, and a card flies out and turns over: a
scene that now joins the video. `useOpenedDrops` remembers what has been found, and `cutDrops` decides which finds a
year gets.

## Install

```bash
pnpm add @react-wrapped/scan @react-wrapped/core gsap
```

GSAP is a peer dependency: you install it yourself. Every `@react-wrapped` package is released under one version number,
so install them all at the same version.

## Use

```tsx
import { useOpenedDrops, YearScan } from "@react-wrapped/scan";
import "@react-wrapped/core/styles.css";
import "@react-wrapped/scan/styles.css";

export function Scan({ calendar, drops, palette }) {
  const { opened, open } = useOpenedDrops("my-wrapped:ada:2026");
  return (
    <YearScan
      calendar={calendar}
      palette={palette}
      drops={drops}
      found={opened}
      onOpen={open}
      describeDay={(day) => `Day ${day + 1}`}
    />
  );
}
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
