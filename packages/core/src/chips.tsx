import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const chip =
  "h-9 flex-none rounded-full bg-muted px-3.5 text-[13.5px] font-semibold first:rounded-full last:rounded-full hover:bg-muted hover:text-foreground data-[state=on]:bg-foreground data-[state=on]:text-background";

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
    <ToggleGroup
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        const option = options.find((item) => item.value === next);
        if (option) onChange(option.value);
      }}
      className="flex-wrap gap-1.5"
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className={chip}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
