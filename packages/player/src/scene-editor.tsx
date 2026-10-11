import { useState } from "react";

import {
  CutPreview,
  type SceneInstance,
  type SlotClassNames,
  transitionList,
  useLabels,
  WRAPPED_FORMATS,
  type WrappedConfig,
  type WrappedTransition,
} from "@react-wrapped/core";
import {
  Chips,
  Modal,
  ModalBody,
  ModalField,
  ModalFooter,
  modalInputClassName,
  PencilLine,
  pill,
  RotateCcw,
  useSlots,
} from "@react-wrapped/core/internal";

/** Every part of the scene editor a class can be given to, by its `data-wr-slot`. */
export const SCENE_EDITOR_SLOTS = [
  // The dialog itself. Its backdrop is this element's `::backdrop`.
  "editor",
  // The top of the dialog: the icon, the title and the line under it.
  "editor-header",
  "editor-icon",
  "editor-title",
  "editor-description",
  // Everything between the header and the buttons.
  "editor-body",
  // One thing to edit: its name and its input.
  "editor-field",
  "editor-label",
  // A text input, one line or several.
  "editor-input",
  // The transition picker: the preview beside the choices.
  "editor-cut",
  "editor-preview",
  "editor-transitions",
  "editor-transition",
  // The row of buttons at the bottom.
  "editor-footer",
  "editor-reset",
  "editor-save",
] as const;

export type SceneEditorSlot = (typeof SCENE_EDITOR_SLOTS)[number];

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
  className,
  classNames,
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
  /** A class for the dialog itself. */
  className?: string;
  /** A class per part, by slot name (`"editor-save"`). Added after the library's own classes on that part. */
  classNames?: SlotClassNames<SceneEditorSlot>;
}) {
  const labels = useLabels();
  const slot = useSlots<SceneEditorSlot>(classNames);
  return (
    <Modal
      open={scene !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      icon={PencilLine}
      title={scene ? labels.editor.title(scene.label) : labels.editor.titleEmpty}
      description={scene && scene.fields.length === 0 ? labels.editor.cutHelp : labels.editor.wordsHelp}
      slots={{
        root: slot("editor", className),
        header: slot("editor-header"),
        icon: slot("editor-icon"),
        title: slot("editor-title"),
        description: slot("editor-description"),
      }}
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
          classNames={classNames}
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
  classNames,
}: {
  scene: SceneInstance;
  original: SceneInstance;
  cut: SceneCut | null;
  config: WrappedConfig;
  onSave: (values: Record<string, string>, style: WrappedTransition | null) => void;
  onClose: () => void;
  classNames?: SlotClassNames<SceneEditorSlot>;
}) {
  const slot = useSlots<SceneEditorSlot>(classNames);
  const fieldSlots = { field: slot("editor-field"), label: slot("editor-label") };
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(scene.fields.map((field) => [field.name, field.value])),
  );
  const [style, setStyle] = useState(cut?.style ?? null);
  const labels = useLabels();
  const defaults = Object.fromEntries(original.fields.map((field) => [field.name, field.value]));
  const wide = WRAPPED_FORMATS[config.format].width > WRAPPED_FORMATS[config.format].height;

  return (
    <>
      <ModalBody slot={slot("editor-body")}>
        {scene.fields.map((field) => {
          const id = `scene-${scene.key}-${field.name}`;
          return (
            <ModalField
              key={field.name}
              label={labels.fields[field.label] ?? field.label}
              htmlFor={id}
              slots={fieldSlots}
            >
              {field.multiline ? (
                <textarea
                  id={id}
                  rows={3}
                  maxLength={240}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                  {...slot("editor-input", "wr:w-full wr:resize-y wr:outline-none", modalInputClassName)}
                />
              ) : (
                <input
                  id={id}
                  maxLength={240}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                  {...slot("editor-input", "wr:w-full wr:outline-none", modalInputClassName)}
                />
              )}
            </ModalField>
          );
        })}
        {cut && style ? (
          <ModalField label={labels.editor.cutField} slots={fieldSlots}>
            <div {...slot("editor-cut", "wr:flex wr:flex-col wr:items-start wr:gap-4", !wide && "wr:sm:flex-row")}>
              {/* The video is behind the modal, so the pick plays here: this scene handing over to the next one. */}
              <div {...slot("editor-preview", "wr:shrink-0 wr:rounded-[12px] wr:ring-1 wr:ring-border")}>
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
                slots={{ group: slot("editor-transitions"), chip: slot("editor-transition") }}
              />
            </div>
          </ModalField>
        ) : null}
      </ModalBody>
      <ModalFooter slot={slot("editor-footer")}>
        <button
          type="button"
          {...slot("editor-reset", pill.quiet)}
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
          {...slot("editor-save", pill.solid)}
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
