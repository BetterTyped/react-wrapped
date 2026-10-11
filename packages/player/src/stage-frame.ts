/**
 * The stage as a picture, one frame at a time: what the video file is made of.
 *
 * The stage is real DOM, so a frame is the stage's own markup inside an SVG `<foreignObject>`, drawn onto a canvas at
 * the video's real resolution. The expensive part of that is normally the styles: copying every element's computed
 * style into its clone costs seconds a frame. Here the stylesheet rules that can touch the stage are collected once
 * and travel with every frame as they are, and a frame is only the markup of what is on screen right now.
 */

/** Rules for these never match an element, so they are tested by the element they hang on. */
const PSEUDO_ELEMENT =
  /::?(?:before|after|first-line|first-letter|marker|placeholder|selection|backdrop|file-selector-button)\b|::[\w-]+(?:\([^)]*\))?/g;

/**
 * Whether a rule can ever style the stage. The stage's own rules always travel: which scene is on, and what the
 * timeline has switched, changes from frame to frame, and a rule that matches nothing now may match a second in.
 */
export function ruleReaches(selector: string, stage: Element): boolean {
  if (selector.includes("wr-")) return true;
  // A pseudo-element with nothing before it stood on every element.
  const plain = selector.replaceAll(PSEUDO_ELEMENT, (_match, at: number) =>
    at === 0 || /[\s,>+~(]/.test(selector[at - 1]) ? "*" : "",
  );
  try {
    const root = stage.ownerDocument.documentElement;
    return root.matches(plain) || stage.matches(plain) || stage.querySelector(plain) !== null;
  } catch {
    // A selector this browser cannot test is one it cannot apply either.
    return false;
  }
}

const isStyle = (rule: CSSRule): rule is CSSStyleRule => "selectorText" in rule && "style" in rule;
const isGroup = (rule: CSSRule): rule is CSSGroupingRule => "cssRules" in rule && !isStyle(rule);

/** The font files the page declares, with what each is for. Read later, when it is known which ones were used. */
interface DeclaredFace {
  rule: CSSFontFaceRule;
  base: string;
}

/** Every rule on the page that can reach the stage, as one stylesheet, and the font files the page declares. */
function stageCss(stage: Element): { css: string; faces: DeclaredFace[] } {
  const faces: DeclaredFace[] = [];

  const sheetCss = (sheet: CSSStyleSheet): string => {
    try {
      return gather(sheet.cssRules, sheet.href ?? stage.ownerDocument.baseURI);
    } catch {
      // Another site's stylesheet cannot be read, and nothing of the stage's lives in one.
      return "";
    }
  };

  const gather = (rules: CSSRuleList, base: string): string => {
    let css = "";
    for (const rule of rules) {
      if (rule instanceof CSSFontFaceRule) {
        faces.push({ rule, base });
      } else if (rule instanceof CSSImportRule) {
        if (rule.styleSheet) css += sheetCss(rule.styleSheet);
      } else if (isStyle(rule)) {
        if (ruleReaches(rule.selectorText, stage)) css += rule.cssText;
      } else if (rule instanceof CSSKeyframesRule) {
        // Nothing on the stage moves by itself: the timeline writes every frame. A keyframe animation would only
        // freeze at its first step.
      } else if (isGroup(rule)) {
        const inner = gather(rule.cssRules, base);
        // "@layer components {", "@media (hover: hover) {": the group's own opening, as the browser wrote it.
        if (inner) css += `${rule.cssText.slice(0, rule.cssText.indexOf("{") + 1)}${inner}}`;
      } else {
        // Layer order, registered properties: small, and the rules above depend on them.
        css += rule.cssText;
      }
    }
    return css;
  };

  let css = "";
  for (const sheet of stage.ownerDocument.styleSheets) css += sheetCss(sheet);
  return { css, faces };
}

const bare = (family: string) => family.replaceAll(/["']/g, "").trim().toLowerCase();
const tight = (value: string) => value.replaceAll(/\s+/g, "").toLowerCase();

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(new Error("A file the video needs could not be read.")));
    reader.readAsDataURL(blob);
  });
}

async function inline(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`A file the video needs did not load (${response.status}).`);
  return dataUrl(await response.blob());
}

/**
 * The fonts the page has actually loaded, carried inside the frame: a picture cannot fetch anything. Only loaded
 * faces travel (the Latin file, not the eleven other scripts declared next to it), because every frame parses them.
 */
async function embeddedFonts(faces: readonly DeclaredFace[], fonts: FontFaceSet): Promise<string> {
  const loaded = new Set(
    [...fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => [bare(face.family), tight(face.style), tight(face.weight), tight(face.unicodeRange)].join("|")),
  );
  const used = faces.filter(({ rule }) => {
    const value = (name: string, unset: string) => tight(rule.style.getPropertyValue(name) || unset);
    const family = bare(rule.style.getPropertyValue("font-family"));
    return loaded.has(
      [
        family,
        value("font-style", "normal"),
        value("font-weight", "normal"),
        value("unicode-range", "U+0-10FFFF"),
      ].join("|"),
    );
  });
  const rules = await Promise.all(
    used.map(async ({ rule, base }) => {
      const source = /url\((["']?)([^"')]+)\1\)/.exec(rule.style.getPropertyValue("src"));
      if (!source) return "";
      const file = await inline(new URL(source[2], base).href);
      return rule.cssText.replace(source[0], `url("${file}")`);
    }),
  );
  return rules.join("");
}

/** What the stage inherits from the page around it. In the picture there is no page, so the stage carries it. */
const INHERITED = [
  "line-height",
  "letter-spacing",
  "font-size",
  "font-weight",
  "font-style",
  "font-kerning",
  "font-optical-sizing",
  "font-variation-settings",
  "text-rendering",
  "text-align",
  "text-transform",
  "word-spacing",
  "white-space",
  "direction",
] as const;

const xmlText = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

/** The markup of the frame on screen: the stage and whatever is in play, at full size. Scenes that are off stay out. */
export function frameMarkup(stage: HTMLElement, carried: string, images: ReadonlyMap<string, string>): string {
  const clone = stage.cloneNode(false) as HTMLElement;
  for (const child of stage.children) {
    if (child.classList.contains("wr-scene") && !child.hasAttribute("data-on")) continue;
    clone.append(child.cloneNode(true));
  }
  clone.style.cssText += `;${carried};transform:none`;
  for (const image of clone.querySelectorAll("img")) {
    const inlined = images.get(image.currentSrc || image.src);
    if (inlined) image.src = inlined;
    else image.remove();
  }
  return new XMLSerializer().serializeToString(clone);
}

export interface FramePainter {
  /** Draws the stage as it stands onto the canvas. */
  paint: (context: CanvasRenderingContext2D) => Promise<void>;
}

/**
 * Gets everything a frame needs that does not change between frames: the rules, the fonts, the pictures. Call it
 * once per video, with the stage in the document.
 */
export async function createFramePainter(
  stage: HTMLElement,
  { width, height }: { width: number; height: number },
): Promise<FramePainter> {
  const page = stage.ownerDocument;
  await page.fonts.ready;

  const rules = stageCss(stage);
  const css = (await embeddedFonts(rules.faces, page.fonts)) + rules.css;

  // Pictures on the stage (the avatar). One that cannot be read is left out of the frame, not out of the video.
  const images = new Map<string, string>();
  await Promise.all(
    [...stage.querySelectorAll("img")].map(async (image) => {
      const source = image.currentSrc || image.src;
      if (!source || images.has(source)) return;
      const inlined = await inline(source).catch(() => null);
      if (inlined) images.set(source, inlined);
    }),
  );

  const computed = getComputedStyle(stage);
  const carried = INHERITED.map((name) => `${name}:${computed.getPropertyValue(name)}`).join(";");

  // The page's root classes (the theme) go on the picture's root, so `:root` and `.dark` rules still find one.
  const rootClass = xmlText(page.documentElement.className).replaceAll('"', "&quot;");
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="${rootClass}"><foreignObject x="0" y="0" width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${width}px;height:${height}px;overflow:hidden"><style>${xmlText(css)}</style>`;
  // The part that never changes is encoded once; a frame only pays for its own markup. It has to be a data URL:
  // a canvas that drew a foreignObject from a blob URL is tainted, and no video frame can be made from it.
  const head = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(open)}`;
  const tail = encodeURIComponent("</div></foreignObject></svg>");
  const image = new Image();

  return {
    paint: async (context) => {
      image.src = head + encodeURIComponent(frameMarkup(stage, carried, images)) + tail;
      await image.decode();
      context.drawImage(image, 0, 0, width, height);
    },
  };
}
