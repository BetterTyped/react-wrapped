/*
 * What an interactive preview wears. The demos are written the way a reader would write them, with plain buttons
 * and no class names, so the page dresses those here. Every rule stops at the library's own roots: nothing inside a
 * `.wr-root` is touched.
 *
 * It is a string in a style element next to each preview, not part of the site's stylesheet, so the previews carry
 * their own look wherever they are drawn. It is written without child combinators and ampersands on purpose: text
 * inside a style element is written out as it stands, and those are the characters a renderer may escape.
 */
const OWN = ":not([class]):not(.wr-root *)";

export const PART_CSS = `
.d-part {
  min-width: 0;
  padding: clamp(12px, 3vw, 24px);
  border-radius: 22px;
  background: var(--d-sunk);
  box-shadow: inset 0 0 0 1px var(--d-line);
}
.d-part [role="group"]${OWN} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}
.d-part [role="group"]${OWN}:first-child {
  margin-top: 0;
}
.d-part button${OWN},
.d-part a${OWN} {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--d-panel);
  box-shadow: inset 0 0 0 1px var(--d-line);
  color: var(--d-ink);
  font: 600 14px var(--d-font);
  text-decoration: none;
  cursor: pointer;
}
.d-part button${OWN}[aria-pressed="true"] {
  background: var(--d-ink);
  color: var(--d-panel);
  box-shadow: none;
}
.d-part button${OWN}:disabled {
  opacity: 0.55;
  cursor: default;
}
.d-part output${OWN} {
  display: block;
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--d-panel);
  box-shadow: inset 0 0 0 1px var(--d-line);
  color: var(--d-dim);
  font: 13px/1.5 var(--d-mono);
  overflow-wrap: anywhere;
}
.d-part p${OWN} {
  margin-top: 12px;
  color: var(--d-dim);
  font-size: 14.5px;
}
.d-part label${OWN} {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.d-part input[type="text"]${OWN} {
  flex: 1 1 220px;
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: var(--d-panel);
  box-shadow: inset 0 0 0 1px var(--d-line);
  font: 13px var(--d-mono);
}
.d-part input[type="color"]${OWN} {
  width: 48px;
  height: 38px;
  padding: 3px;
  border: 0;
  border-radius: 10px;
  background: var(--d-panel);
  box-shadow: inset 0 0 0 1px var(--d-line);
  cursor: pointer;
}
.d-part img${OWN} {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px;
}
`;
