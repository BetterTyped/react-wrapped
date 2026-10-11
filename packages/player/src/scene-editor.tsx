import { useState } from "react";

import {
  CutPreview,
  type SceneInstance,
  transitionList,
  useLabels,
  WRAPPED_FORMATS,
  type WrappedConfig,
  type WrappedTransition,
} from "@react-wrapped/core";
import {
  Chips,
  cn,
  Modal,
  ModalBody,
  ModalField,
  ModalFooter,
  modalInputClassName,
  PencilLine,
  pill,
  RotateCcw,
} from "@react-wrapped/core/internal";

/** The way out of the scene being edited. */
export interface SceneCut {
  /** The transition it plays now. */
  style: WrappedTransition;
  /** The one the cut's luck picked, to restore. */
  original: WrappedTransition;
  /** The scene it hands over to, for the preview. */
  next: SceneInstance;
}

/** The preview is small enough to sit beside the chips, or above them when the video is wide. */
const PREVIEW_WIDTH = { story: 112, square: 176, landscape: 288 } as const;

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
  const labels = useLabels();
  return (
    <Modal
      open={scene !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      icon={PencilLine}
      title={scene ? labels.editor.title(scene.label) : labels.editor.titleEmpty}
      description={scene && scene.fields.length === 0 ? labels.editor.cutHelp : labels.editor.wordsHelp}
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
    </Modal>
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
  const labels = useLabels();
  const defaults = Object.fromEntries(original.fields.map((field) => [field.name, field.value]));
  const wide = WRAPPED_FORMATS[config.format].width > WRAPPED_FORMATS[config.format].height;

  return (
    <>
      <ModalBody>
        {scene.fields.map((field) => {
          const id = `scene-${scene.key}-${field.name}`;
          return (
            <ModalField key={field.name} label={labels.fields[field.label] ?? field.label} htmlFor={id}>
              {field.multiline ? (
                <textarea
                  id={id}
                  rows={3}
                  maxLength={240}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                  className={cn("wr:w-full wr:resize-y wr:outline-none", modalInputClassName)}
                />
              ) : (
                <input
                  id={id}
                  maxLength={240}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                  className={cn("wr:w-full wr:outline-none", modalInputClassName)}
                />
              )}
            </ModalField>
          );
        })}
        {cut && style ? (
          <ModalField label={labels.editor.cutField}>
            <div className={cn("wr:flex wr:flex-col wr:items-start wr:gap-4", !wide && "wr:sm:flex-row")}>
              {/* The video is behind the modal, so the pick plays here: this scene handing over to the next one. */}
              <div className="wr:shrink-0 wr:rounded-[12px] wr:ring-1 wr:ring-border">
                <CutPreview
                  style={style}
                  first={scene}
                  second={cut.next}
                  config={config}
                  width={PREVIEW_WIDTH[config.format]}
                />
              </div>
              <Chips
                label={labels.editor.cut}
                value={style}
                // Read when the editor opens, so a transition added with `defineTransition` is offered too.
                options={transitionList().map((transition) => ({
                  value: transition.id,
                  label: labels.transitions[transition.id] ?? transition.label,
                }))}
                onChange={setStyle}
              />
            </div>
          </ModalField>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className={pill.quiet}
          onClick={() => {
            setValues(defaults);
            setStyle(cut?.original ?? null);
          }}
        >
          <RotateCcw />
          {labels.editor.reset}
        </button>
        <button
          type="button"
          className={pill.solid}
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
          {labels.editor.save}
        </button>
      </ModalFooter>
    </>
  );
}
