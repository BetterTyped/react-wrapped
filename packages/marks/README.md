# @react-wrapped/marks

The marks react-wrapped presses into the bottom right corner of the stage.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

A mark is one 24 by 24 path the stage presses into its corner like a coin. This package is a set of ready-made ones, by
name. Hand one to `subject.mark`, or pass a path of your own and skip this package.

The names and logos belong to their owners. Shipping a path here is not a claim on any of them, and you are responsible
for using a mark the way its owner allows.

## Install

```bash
pnpm add @react-wrapped/marks
```

Every `@react-wrapped` package is released under one version number, so install them all at the same version.

## Use

```tsx
import { markOf } from "@react-wrapped/marks";

const subject = {
  handle: "ada",
  name: "Ada",
  avatarUrl: null,
  caption: "My year in code",
  period: "2026",
  mark: markOf("github"),
};
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
