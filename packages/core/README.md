# @react-wrapped/core

The stage, the motion kit, palettes, formats and transitions of react-wrapped.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

Everything else in `@react-wrapped` stands on this: `WrappedStage`, `defineScene` and the motion helpers (`linesIn`,
`riseIn`, `countUp`, `hold`), the palettes and the three formats, the nineteen transitions and `defineTransition`, and
the config that fits in a URL.

## Install

```bash
pnpm add @react-wrapped/core gsap
```

GSAP is a peer dependency: you install it yourself. Every `@react-wrapped` package is released under one version number,
so install them all at the same version.

## Use

```tsx
import { defineScene, hold, Lines, linesIn } from "@react-wrapped/core";
import "@react-wrapped/core/styles.css";
import { gsap } from "gsap";

export const helloScene = defineScene<{ title: readonly string[] }>({
  render: ({ title }) => <Lines lines={title} />,
  animate: ({ root }) => {
    const tl = gsap.timeline();
    linesIn(tl, root, { at: 0 });
    hold(tl, 1.5);
    return tl;
  },
});
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
