# @react-wrapped/kit

Year in review videos, in React. Everything in one install.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

This is the package to install if you want all of it: the stage, the scenes, the charts, the transitions, the player
with its timeline editor, the year scan and the graphics to keep. It also has `WrappedView`, the whole page as one
component.

## Install

```bash
pnpm add @react-wrapped/kit gsap
```

GSAP is a peer dependency: you install it yourself. Every `@react-wrapped` package is released under one version number,
so install them all at the same version.

## Use

```tsx
import { useState } from "react";
import { bigNumberScene, DEFAULT_WRAPPED_CONFIG, WrappedView } from "@react-wrapped/kit";
import "@react-wrapped/kit/styles.css";

const subject = { handle: "ada", name: "Ada", avatarUrl: null, caption: "Orbit Wrapped", period: "2026" };
const scenes = [
  bigNumberScene(
    { eyebrow: "This year", value: 1687, title: ["commits."], lede: "**4.6** a day.", counter: "climb", variant: 0 },
    { key: "total", label: "Total" },
  ),
];

export function MyWrapped() {
  const [config, setConfig] = useState(DEFAULT_WRAPPED_CONFIG);
  return <WrappedView subject={subject} seed="ada-2026" scenes={scenes} config={config} onConfigChange={setConfig} />;
}
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
