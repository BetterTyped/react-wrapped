import { Check, Copy, Download, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "./internal/cn";
import { useCopied } from "./internal/use-copied";
import type { WrappedPalette } from "./types";

/** One thing a Wrapped hands its owner to keep: a card, a badge, the trophy case. */
export interface WrappedGraphic {
  id: string;
  title: string;
  line: string;
  /** Where the picture comes from: a hot-linked image, or something drawn here on demand. */
  image: string | (() => Promise<Blob>);
  /** The saved file's name, without an extension. */
  fileName: string;
  /** For a hot-linked image: the snippet that embeds it, so it stays live in a README. */
  markdown?: string;
  /** Not unlocked yet: the scan has not found it. Shown as a closed tile, nothing to download. */
  locked?: boolean;
  /** Wide artwork (a card) takes two columns. */
  wide?: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("The image did not load.")));
    image.src = src;
  });
}

/** An SVG as a PNG at twice its size: what people can actually post, where an SVG would be refused. */
async function rasterize(svg: Blob): Promise<Blob> {
  const url = URL.createObjectURL(svg);
  const image = await loadImage(url).finally(() => setTimeout(() => URL.revokeObjectURL(url), 1000));
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth * 2;
  canvas.height = image.naturalHeight * 2;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser blocked the canvas the image is drawn on.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the image."));
    });
  });
}

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const action =
  "inline-flex h-10 min-w-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold transition-transform hover:-translate-y-px disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4";

function GraphicTile({ graphic, palette }: { graphic: WrappedGraphic; palette: WrappedPalette }) {
  const [copied, copy] = useCopied();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // A drawn graphic has no address until it is drawn: its preview is made once, here.
  const [drawn, setDrawn] = useState<string | null>(null);
  const { image } = graphic;
  // Drawing costs real time (a card is laid out and captured), so a tile draws when it is about to be seen, not when
  // the page loads with the gallery three screens down.
  const tileRef = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  // A locked tile is a different element with nothing to watch. This has to run again when the scan unlocks it:
  // watching only once, on mount, left every card found after the page opened as a pulsing dot for good.
  const { locked } = graphic;
  useEffect(() => {
    const tile = tileRef.current;
    if (!tile || near || locked) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(tile);
    return () => observer.disconnect();
  }, [near, locked]);
  useEffect(() => {
    if (typeof image === "string" || locked || !near) return;
    let url: string | null = null;
    let gone = false;
    const draw = async () => {
      const blob = await image().catch(() => null);
      if (gone) return;
      if (!blob) {
        setFailed(true);
        return;
      }
      url = URL.createObjectURL(blob);
      setDrawn(url);
    };
    void draw();
    return () => {
      gone = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [image, locked, near]);

  const download = async () => {
    setBusy(true);
    setFailed(false);
    const fetched =
      typeof image === "string"
        ? fetch(image)
            .then((response) => {
              if (!response.ok) throw new Error(`The image answered ${response.status}.`);
              return response.blob();
            })
            .then(rasterize)
        : image();
    const file = await fetched.catch(() => null);
    if (file) save(file, `${graphic.fileName}.png`);
    else setFailed(true);
    setBusy(false);
  };

  const src = typeof image === "string" ? image : drawn;

  // The plate is the picked theme's own background, so a graphic sits on the color it was made for, and the text and
  // buttons take the theme's ink. Every plate is the same one: tinting it in the badge's rarity made a Common and a
  // Rare look like two different kinds of tile. The badge says how rare it is.
  const ink = palette.fg;
  const soft = palette.muted;

  if (locked) {
    return (
      <article
        className="flex min-h-[340px] flex-col rounded-[32px] p-7"
        style={{
          background: palette.bg,
          color: soft,
          boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${ink} 12%, transparent)`,
        }}
      >
        <div className="grid flex-1 place-items-center">
          <span
            className="grid size-16 place-items-center rounded-full"
            style={{ background: `color-mix(in oklch, ${ink} 7%, transparent)` }}
          >
            <Lock className="size-6" />
          </span>
        </div>
        <h4 className="text-[clamp(1.25rem,1.6vw,1.5rem)] font-semibold leading-none tracking-[-0.04em]">
          Still hidden
        </h4>
        <p className="mt-2 text-[14.5px] leading-[1.4]">Scan your year to unlock it.</p>
      </article>
    );
  }

  return (
    <article
      ref={tileRef}
      className={cn(
        "group/tile relative flex min-h-[340px] flex-col overflow-hidden rounded-[32px] p-7 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1.5",
        graphic.wide && "md:col-span-2",
      )}
      style={{
        color: ink,
        background: palette.bg,
        boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${ink} 8%, transparent)`,
      }}
    >
      <div className="@container grid flex-1 place-items-center py-6">
        {src ? (
          <img
            src={src}
            alt={graphic.title}
            loading="lazy"
            className={cn(
              "w-auto max-w-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.2,1.4,0.4,1)] group-hover/tile:scale-[1.04]",
              // A badge's height follows its tile's width, so every badge is shown at one scale: the widest ("2,052
              // contributions made") fits, and a short one beside it is not drawn bigger just because it had room.
              graphic.wide ? "max-h-[300px]" : "h-[27cqw] max-h-[90px]",
              // A drawn card is a full frame in the plate's own color: a soft edge is what tells it from the plate.
              typeof image === "string" ? null : "rounded-[18px]",
            )}
            style={
              typeof image === "string"
                ? undefined
                : { boxShadow: `0 0 0 1px color-mix(in oklch, ${ink} 10%, transparent)` }
            }
          />
        ) : (
          <span
            className="size-8 animate-pulse rounded-full"
            style={{ background: `color-mix(in oklch, ${ink} 15%, transparent)` }}
          />
        )}
      </div>
      <div
        className={cn(
          "flex gap-5",
          graphic.wide ? "items-end justify-between max-sm:flex-col max-sm:items-start" : "flex-col",
        )}
      >
        <div className="min-w-0 flex-1">
          <h4 className="text-[clamp(1.25rem,1.6vw,1.5rem)] font-semibold leading-none tracking-[-0.04em]">
            {graphic.title}
          </h4>
          <p className="mt-2 max-w-[46ch] text-[14.5px] leading-[1.4]" style={{ color: soft }}>
            {graphic.line}
          </p>
        </div>
        {/* Side by side, always. */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void download()}
            disabled={busy}
            className={action}
            style={{ background: ink, color: palette.bg }}
          >
            <Download />
            Download
          </button>
          {graphic.markdown ? (
            <button
              type="button"
              onClick={() => copy(graphic.markdown ?? "")}
              title="Copy the snippet that embeds it"
              className={action}
              style={{ background: `color-mix(in oklch, ${ink} 10%, transparent)`, color: ink }}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Markdown"}
            </button>
          ) : null}
        </div>
      </div>
      {failed ? (
        <p role="alert" className="mt-3 text-[13px]" style={{ color: soft }}>
          That did not come through. Try again in a moment.
        </p>
      ) : null}
    </article>
  );
}

/**
 * Everything a Wrapped gives its owner to keep, as tiles on the page itself, the way the brand page lays out its
 * logos: no card around them. See each on a dark plate, download it as a PNG, or copy the snippet that hot-links it.
 * Graphics the scan has not found yet sit there locked, so there is always one more to get.
 */
export function GraphicsGallery({
  graphics,
  palette,
}: {
  graphics: readonly WrappedGraphic[];
  /** The picked theme: the plates follow it, like the images on them. */
  palette: WrappedPalette;
}) {
  const unlocked = graphics.filter((graphic) => !graphic.locked).length;
  const locked = graphics.length - unlocked;
  return (
    <section className="pt-10 md:pt-14">
      <h3 className="text-[clamp(1.75rem,2.6vw,2.5rem)] font-semibold leading-none tracking-[-0.05em]">
        {unlocked} {unlocked === 1 ? "graphic" : "graphics"} <span className="text-primary">to keep.</span>
      </h3>
      <p className="mt-3 mb-7 max-w-[60ch] text-[17px] leading-[1.5] text-muted-foreground">
        {locked > 0
          ? `Post them, pin them, put them in your README. ${locked} more ${locked === 1 ? "unlocks" : "unlock"} as the scan finds ${locked === 1 ? "it" : "them"}.`
          : "Post them, pin them, put them in your README."}
      </p>
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {/* What can be taken first; what is still locked after it. */}
        {graphics
          .toSorted((a, b) => Number(Boolean(a.locked)) - Number(Boolean(b.locked)))
          .map((graphic) => (
            <GraphicTile key={graphic.id} graphic={graphic} palette={palette} />
          ))}
      </div>
    </section>
  );
}
