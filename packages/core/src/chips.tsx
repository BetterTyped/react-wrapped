import { cn } from "./internal/cn";

const chip =
  "wr:inline-flex wr:h-9 wr:flex-none wr:cursor-pointer wr:items-center wr:justify-center wr:rounded-full wr:bg-muted wr:px-3.5 wr:text-[13.5px] wr:font-semibold wr:whitespace-nowrap wr:outline-none wr:transition-colors wr:hover:text-foreground wr:focus-visible:ring-[3px] wr:focus-visible:ring-ring/50 wr:aria-checked:bg-foreground wr:aria-checked:text-background";

/** One choice out of a few, as a row of chips that wraps. One is always picked. */
export function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="wr-root wr:flex wr:w-fit wr:flex-wrap wr:items-center wr:gap-1.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          // Arrow keys move between the choices, the way a native radio group does; Tab leaves the group.
          tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            const step =
              event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : 0;
            if (step === 0) return;
            event.preventDefault();
            const index = options.findIndex((item) => item.value === value);
            const next = options[(index + step + options.length) % options.length];
            if (next) onChange(next.value);
            const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
            buttons?.[(index + step + options.length) % options.length]?.focus();
          }}
          className={cn(chip)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
