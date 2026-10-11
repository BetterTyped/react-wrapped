import { RARITY_LABELS, type WrappedPalette, type WrappedToken } from "@react-wrapped/core";

/**
 * The share card as a PNG, drawn on a canvas so the file is identical on every
 * machine and sharp at 2x. 1200x630 is the size X, LinkedIn and Slack all show
 * without cropping, and it reads well pasted into a profile or a README.
 */
export interface ShareCardSpec {
  handle: string;
  avatarUrl: string | null;
  /** "GitHub Wrapped" */
  caption: string;
  /** "Oct 2025 to Oct 2026" */
  period: string;
  /** Optional contribution graph: levels 0 to 4 per day, plus how many empty slots precede the first day. */
  graph?: { levels: readonly number[]; lead: number };
  /** Up to four headline numbers. */
  stats: readonly { label: string; value: string }[];
  /** What this person pulled: the same tonal tokens as the last scene, at most two. */
  tokens?: readonly WrappedToken[];
  /** A quiet line saying where the video is from: a site address, a product name. Left out, nothing is shown. */
  brand?: string;
}

const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2;
const PAD = 64;
const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => resolve(null));
    image.src = src;
  });
}

/** Sets the largest font, down to a floor, at which the text fits the width. */
function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  { maxWidth, size, weight, floor = 24 }: { maxWidth: number; size: number; weight: number; floor?: number },
) {
  const canvas = context;
  let current = size;
  canvas.font = `${weight} ${current}px ${FONT}`;
  while (canvas.measureText(text).width > maxWidth && current > floor) {
    current -= 2;
    canvas.font = `${weight} ${current}px ${FONT}`;
  }
}

export async function renderShareCard(spec: ShareCardSpec, palette: WrappedPalette): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = HEIGHT * SCALE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser blocked the canvas the card is drawn on.");
  context.scale(SCALE, SCALE);
  await document.fonts.ready;

  // Ground and the one light source, as on the video.
  context.fillStyle = palette.bg;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  const accent = palette.levels[4];
  const glow = context.createRadialGradient(140, 40, 0, 140, 40, 640);
  glow.addColorStop(0, accent);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.globalAlpha = 0.22;
  context.fillStyle = glow;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.globalAlpha = 1;

  // Who.
  const avatar = spec.avatarUrl ? await loadImage(spec.avatarUrl) : null;
  context.save();
  context.beginPath();
  context.arc(PAD + 36, PAD + 36, 36, 0, Math.PI * 2);
  context.clip();
  if (avatar) {
    context.drawImage(avatar, PAD, PAD, 72, 72);
  } else {
    context.fillStyle = accent;
    context.fillRect(PAD, PAD, 72, 72);
    context.fillStyle = palette.bg;
    context.font = `800 28px ${FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(spec.handle.slice(0, 2).toUpperCase(), PAD + 36, PAD + 37);
    context.textAlign = "left";
  }
  context.restore();

  context.textBaseline = "alphabetic";
  context.fillStyle = palette.fg;
  fitText(context, `@${spec.handle}`, { maxWidth: 560, size: 40, weight: 800 });
  context.fillText(`@${spec.handle}`, PAD + 96, PAD + 34);
  context.fillStyle = palette.muted;
  context.font = `500 21px ${FONT}`;
  context.fillText(`${spec.caption}, ${spec.period}`, PAD + 96, PAD + 66);

  // Where it came from, quietly, top right. Only when the card says so.
  if (spec.brand) {
    context.globalAlpha = 0.6;
    context.font = `600 18px ${FONT}`;
    context.textAlign = "right";
    context.fillStyle = palette.muted;
    context.fillText(spec.brand, WIDTH - PAD, PAD + 30);
    context.textAlign = "left";
    context.globalAlpha = 1;
  }

  // The year, as GitHub draws it.
  let y = PAD + 120;
  if (spec.graph) {
    const cell = 15;
    const gap = 4;
    spec.graph.levels.forEach((level, index) => {
      const slot = index + spec.graph!.lead;
      context.fillStyle = palette.levels[level] ?? palette.levels[0];
      context.beginPath();
      context.roundRect(PAD + Math.floor(slot / 7) * (cell + gap), y + (slot % 7) * (cell + gap), cell, cell, 3.5);
      context.fill();
    });
    y += 7 * (cell + gap) + 52;
  }

  // The numbers.
  const columns = Math.max(1, spec.stats.length);
  const columnWidth = (WIDTH - PAD * 2) / columns;
  spec.stats.forEach((stat, index) => {
    const x = PAD + index * columnWidth;
    context.fillStyle = palette.muted;
    context.font = `500 20px ${FONT}`;
    context.fillText(stat.label, x, y);
    context.fillStyle = palette.fg;
    fitText(context, stat.value, { maxWidth: columnWidth - 24, size: 52, weight: 800, floor: 28 });
    context.fillText(stat.value, x, y + 58);
  });

  // The pulls, as tonal tokens: one tinted object each, the art and the kind in the rarity's colour.
  const tokens = (spec.tokens ?? []).slice(0, 2);
  const tokenGap = 16;
  const tokenWidth = (WIDTH - PAD * 2 - tokenGap) / 2;
  const tokenHeight = 84;
  const tokenY = HEIGHT - PAD - tokenHeight;
  tokens.forEach((token, index) => {
    const x = PAD + index * (tokenWidth + tokenGap);
    const colour = palette.rarity[token.rarity];
    context.fillStyle = palette.card;
    context.beginPath();
    context.roundRect(x, tokenY, tokenWidth, tokenHeight, 20);
    context.fill();
    context.globalAlpha = 0.14;
    context.fillStyle = colour;
    context.fill();
    context.globalAlpha = 0.4;
    context.strokeStyle = colour;
    context.lineWidth = 1.5;
    context.stroke();

    const cell = 6;
    const artX = x + 18;
    const artY = tokenY + (tokenHeight - 9 * cell) / 2;
    token.art.forEach((row, rowIndex) => {
      [...row].forEach((char, column) => {
        context.globalAlpha = char === "x" ? 1 : char === "o" ? 0.45 : 0.1;
        context.fillRect(artX + column * cell, artY + rowIndex * cell, cell - 1, cell - 1);
      });
    });

    // The name, then its rarity under it in normal case: no overline, no capitals.
    context.globalAlpha = 1;
    context.fillStyle = palette.fg;
    fitText(context, token.name, { maxWidth: tokenWidth - 9 * cell - 64, size: 26, weight: 700, floor: 18 });
    context.fillText(token.name, artX + 9 * cell + 18, tokenY + 40);
    context.fillStyle = colour;
    context.font = `650 16px ${FONT}`;
    context.fillText(RARITY_LABELS[token.rarity], artX + 9 * cell + 18, tokenY + 64);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the card."));
    }, "image/png");
  });
}
