import { PencilLine, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Chips } from "./chips";
import { TRANSITION_LABELS } from "./cuts";
import { CutPreview } from "./stage";
import {
  WRAPPED_FORMATS,
  WRAPPED_TRANSITIONS,
  type SceneInstance,
  type WrappedConfig,
  type WrappedTransition,
} from "./types";
import { pillVariants } from "@/components/layouts/storefront/account-parts";
import {
  ModalBody,
  ModalField,
  ModalFooter,
  ModalShell,
  modalInputClassName,
} from "@/components/layouts/storefront/modal-shell";
import { cn } from "@/lib/utils";

/** The way out of the scene being edited. */
export interface SceneCut {
  /** The transition it plays now. */
  style: WrappedTransition;
  /** The one the cut's luck picked, to restore. */
  original: WrappedTransition;
  /** The scene it hands over to, for the preview. */
  next: SceneInstance;
}

const TRANSITION_OPTIONS = WRAPPED_TRANSITIONS.map((style) => ({ value: style, label: TRANSITION_LABELS[style] }));

/** The preview is small enough to sit beside the chips, or above them when the video is wide. */
const PREVIEW_WIDTH = { story: 112, square: 176, landscape: 288 } as const;

const WORDS_HELP =
  "Wrap words in *stars* to color them, **double stars** to make them bold. A new line in a headline starts a new line on screen.";

/**
 * Everything that belongs to one scene: its texts and the transition out of it. Starts from what the scene plays now
 * (the director's words and the luck's transition, or the creator's last edit); clearing a field gives the director's
 * words back.
 */
export function SceneEditor({
  scene,
  original,
  cut,
  config,
  onSave,
  onClose,
}: {
  /** The scene as it plays now, edits applied. Null keeps the modal closed. */
  scene: SceneInstance | null;
  /** The same scene with no edits, to restore from. */
  original: SceneInstance | null;
  /** Null on a scene with no way out: the last one playing, or one that is switched off. */
  cut: SceneCut | null;
  config: WrappedConfig;
  /** The rewritten texts, and the transition when the scene has one. */
  onSave: (values: Record<string, string>, style: WrappedTransition | null) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell
      open={scene !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      icon={PencilLine}
      title={scene ? `Edit "${scene.label}"` : "Edit scene"}
      description={scene && scene.fields.length === 0 ? "Pick how this scene hands over to the next one." : WORDS_HELP}
    >
      {scene && original ? (
        // Keyed by scene, so opening another scene starts from its own texts.
        <SceneEditorForm
          key={scene.key}
          scene={scene}
          original={original}
          cut={cut}
          config={config}
          onSave={onSave}
          onClose={onClose}
        />
      ) : null}
    </ModalShell>
  );
}

function SceneEditorForm({
  scene,
  original,
  cut,
  config,
  onSave,
  onClose,
}: {
  scene: SceneInstance;
  original: SceneInstance;
  cut: SceneCut | null;
  config: WrappedConfig;
  onSave: (values: Record<string, string>, style: WrappedTransition | null) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(scene.fields.map((field) => [field.name, field.value])),
  );
  const [style, setStyle] = useState(cut?.style ?? null);
  const defaults = Object.fromEntries(original.fields.map((field) => [field.name, field.value]));
  const wide = WRAPPED_FORMATS[config.format].width > WRAPPED_FORMATS[config.format].height;

  return (
    <>
      <ModalBody>
        {scene.fields.map((field) => {
          const id = `scene-${scene.key}-${field.name}`;
          return (
            <ModalField key={field.name} label={field.label} htmlFor={id}>
              {field.multiline ? (
                <textarea
                  id={id}
                  rows={3}
                  maxLength={240}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                  className={cn("w-full resize-y outline-none", modalInputClassName)}
                />
              ) : (
                <input
                  id={id}
                  maxLength={240}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                  className={cn("w-full outline-none", modalInputClassName)}
                />
              )}
            </ModalField>
          );
        })}
        {cut && style ? (
          <ModalField label="Transition to the next scene">
            <div className={cn("flex flex-col items-start gap-4", !wide && "sm:flex-row")}>
              {/* The video is behind the modal, so the pick plays here: this scene handing over to the next one. */}
              <div className="shrink-0 rounded-[12px] ring-1 ring-border">
                <CutPreview
                  style={style}
                  first={scene}
                  second={cut.next}
                  config={config}
                  width={PREVIEW_WIDTH[config.format]}
                />
              </div>
              <Chips label="Transition" value={style} options={TRANSITION_OPTIONS} onChange={setStyle} />
            </div>
          </ModalField>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className={pillVariants({ variant: "quiet" })}
          onClick={() => {
            setValues(defaults);
            setStyle(cut?.original ?? null);
          }}
        >
          <RotateCcw />
          Original scene
        </button>
        <button
          type="button"
          className={pillVariants()}
          onClick={() => {
            // Only what differs from the director's words is kept, so the link stays short.
            onSave(
              Object.fromEntries(
                Object.entries(values).filter(([name, value]) => value.trim() !== "" && value !== defaults[name]),
              ),
              style,
            );
            onClose();
          }}
        >
          Save
        </button>
      </ModalFooter>
    </>
  );
}
