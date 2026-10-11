import { useMemo, useState } from "react";

import {
  editsFor,
  luckyCut,
  type SceneInstance,
  SceneThumb,
  type WrappedConfig,
  type WrappedTransition,
} from "@react-wrapped/core";
import { SceneEditor } from "@react-wrapped/player";

export function EditOneScene({
  original,
  next,
  seed,
  config,
  onConfigChange,
}: {
  /** The scene as the director wrote it. */
  original: SceneInstance;
  /** The scene that plays after it, for the transition's preview. */
  next: SceneInstance;
  seed: string;
  config: WrappedConfig;
  onConfigChange: (next: WrappedConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const { key } = original;
  // The scene as it plays now: the director's words with the viewer's edits over them.
  const scene = useMemo(() => original.withEdits(editsFor(config.edits, key)), [original, config.edits, key]);
  // The transition the seed picked for this scene. A pick of the viewer's own is kept in `config.cuts`.
  const lucky = luckyCut(seed, key);

  const save = (values: Record<string, string>, style: WrappedTransition | null) => {
    // Edits are stored flat, as "<scene key>.<field name>", so they fit in one URL parameter.
    const others = Object.entries(config.edits).filter(([name]) => !name.startsWith(`${key}.`));
    const mine = Object.entries(values).map(([field, value]): [string, string] => [`${key}.${field}`, value]);
    const cuts = Object.fromEntries(Object.entries(config.cuts).filter(([sceneKey]) => sceneKey !== key));
    // Only a pick that differs from the seed's own is worth keeping.
    if (style && style !== lucky) cuts[key] = style;
    onConfigChange({ ...config, edits: Object.fromEntries([...others, ...mine]), cuts });
  };

  return (
    <div>
      <SceneThumb scene={scene} config={config} width={280} />
      <div role="group" aria-label="Scene">
        <button type="button" onClick={() => setOpen(true)}>
          Edit this scene
        </button>
      </div>
      <output>{`edits: ${JSON.stringify(config.edits)} cuts: ${JSON.stringify(config.cuts)}`}</output>
      <SceneEditor
        scene={open ? scene : null}
        original={original}
        cut={{ style: config.cuts[key] ?? lucky, original: lucky, next }}
        config={config}
        onSave={save}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
