const base =
  "wr:inline-flex wr:h-11 wr:shrink-0 wr:cursor-pointer wr:items-center wr:justify-center wr:gap-2 wr:rounded-full wr:px-5 wr:text-[15px] wr:font-semibold wr:whitespace-nowrap wr:no-underline wr:outline-none wr:transition-[transform,background-color,border-color,color] wr:duration-200 wr:focus-visible:ring-[3px] wr:focus-visible:ring-ring/50 wr:disabled:pointer-events-none wr:disabled:opacity-50 wr:[&_svg]:size-4 wr:[&_svg]:shrink-0";

/** The two pill buttons the editor uses: the solid one that commits, and the quiet one next to it. */
export const pill = {
  solid: `${base} wr:bg-foreground wr:text-background wr:hover:-translate-y-px`,
  quiet: `${base} wr:text-muted-foreground wr:hover:text-foreground`,
} as const;
