# @react-wrapped/player

The player for a react-wrapped video: controls, a timeline that is the editor, MP4 export.

Part of [react-wrapped](https://bettertyped.github.io/react-wrapped/), the library behind
[Hype Stack's Wrapped](https://www.hype-stack.dev/wrapped?utm_source=react-wrapped&utm_medium=referral&utm_campaign=npm-readme).

`WrappedPlayer` puts a transport and a timeline around the stage. The timeline is also the editor: switch a scene off,
move it, rewrite its words, pick its transition. `WrappedConfigurator` is the settings panel, and `renderVideo` saves
the video as an MP4, drawn frame by frame in the browser.

## Install

```bash
pnpm add @react-wrapped/player @react-wrapped/core gsap
```

GSAP is a peer dependency: you install it yourself. Every `@react-wrapped` package is released under one version number,
so install them all at the same version.

## Use

```tsx
import { useRef } from "react";
import { DEFAULT_WRAPPED_CONFIG } from "@react-wrapped/core";
import { WrappedPlayer, type WrappedPlayerHandle } from "@react-wrapped/player";
import "@react-wrapped/core/styles.css";
import "@react-wrapped/player/styles.css";

export function Video({ subject, scenes }) {
  const player = useRef<WrappedPlayerHandle>(null);
  return (
    <>
      <WrappedPlayer ref={player} subject={subject} seed="ada-2026" scenes={scenes} config={DEFAULT_WRAPPED_CONFIG} />
      <button onClick={() => player.current?.seek(0)}>Back to the start</button>
    </>
  );
}
```

## Docs

- [Documentation](https://bettertyped.github.io/react-wrapped/docs/)
- [Every design on one page](https://bettertyped.github.io/react-wrapped/designs/)
- [A full Wrapped, playing](https://bettertyped.github.io/react-wrapped/examples/full-wrapped/)

## License

[MIT](./LICENSE.md)
