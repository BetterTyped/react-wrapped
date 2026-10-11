const base =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold whitespace-nowrap no-underline outline-none transition-[transform,background-color,border-color,color] duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

/** The two pill buttons the editor uses: the solid one that commits, and the quiet one next to it. */
export const pill = {
  solid: `${base} bg-foreground text-background hover:-translate-y-px`,
  quiet: `${base} text-muted-foreground hover:text-foreground`,
} as const;
