import type { ComponentProps } from "react";

import { cn } from "./cn";
import type { SlotProps } from "./slots";

/** An on/off switch on a plain button, so the library needs no component kit to draw one. */
export function Switch({
  checked,
  onCheckedChange,
  className,
  thumb,
  ...props
}: Omit<ComponentProps<"button">, "onChange" | "role"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** What the component using the switch calls the dot that slides. The switch itself takes its slot as props. */
  thumb?: SlotProps;
}) {
  const state = checked ? "checked" : "unchecked";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={state}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "wr:peer wr:inline-flex wr:h-[1.15rem] wr:w-8 wr:shrink-0 wr:cursor-pointer wr:items-center wr:rounded-full wr:border wr:border-transparent wr:shadow-xs wr:transition-all wr:outline-none wr:focus-visible:border-ring wr:focus-visible:ring-[3px] wr:focus-visible:ring-ring/50 wr:disabled:cursor-not-allowed wr:disabled:opacity-50 wr:data-[state=checked]:bg-primary wr:data-[state=unchecked]:bg-input wr:dark:data-[state=unchecked]:bg-input/80",
        className,
      )}
      {...props}
    >
      <span
        data-state={state}
        {...thumb}
        className={cn(
          "wr:pointer-events-none wr:block wr:size-4 wr:rounded-full wr:bg-background wr:ring-0 wr:transition-transform wr:data-[state=checked]:translate-x-[calc(100%-2px)] wr:data-[state=unchecked]:translate-x-0 wr:dark:data-[state=checked]:bg-primary-foreground wr:dark:data-[state=unchecked]:bg-foreground",
          thumb?.className,
        )}
      />
    </button>
  );
}
