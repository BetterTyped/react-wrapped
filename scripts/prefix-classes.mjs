/* oxlint-disable no-console -- a command line tool says what it did */
// Puts the library's prefix on every Tailwind class in its source, so its stylesheet can be compiled once and
// shipped: `flex` becomes `wr:flex`. The library's own classes (`wr-stage`) are left alone.
//   node prefix-classes.mjs <src dir> [--write]
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(`${process.cwd()}/`);
const ts = require("typescript");

const [dir, flag] = process.argv.slice(2);
const write = flag === "--write";
const PREFIX = "wr:";
const seen = new Map();
const odd = [];

const keep = (token) => token === "" || token.startsWith("wr-") || token.startsWith(PREFIX);
const prefixed = (text, file) =>
  text.replace(/\S+/g, (token) => {
    if (keep(token)) return token;
    // "Dark here, whatever the page is": a class of the library's own, not a utility.
    if (token === "dark") return "wr-dark";
    if (!/^[a-z!\-[@*]/.test(token) || /[{}$"'=;]/.test(token)) odd.push(`${file}: ${token}`);
    seen.set(token, (seen.get(token) ?? 0) + 1);
    return PREFIX + token;
  });

for (const name of readdirSync(dir, { recursive: true })) {
  if (!/\.tsx?$/.test(name) || /\.test\./.test(name)) continue;
  // A file that is nothing but class strings handed to components elsewhere.
  const wholeFile = name.endsWith("internal/pill.ts");
  const file = path.join(dir, name);
  const source = readFileSync(file, "utf8");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  /** [start, end] of string contents to rewrite. */
  const spans = new Map();
  const declared = new Map();
  const collectDeclarations = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer)
      declared.set(node.name.text, node.initializer);
    ts.forEachChild(node, collectDeclarations);
  };
  collectDeclarations(tree);
  const visited = new Set();
  const take = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      spans.set(node.getStart() + 1, node.getEnd() - 1);
    else if (ts.isTemplateExpression(node)) {
      spans.set(node.head.getStart() + 1, node.head.getEnd() - 2);
      for (const span of node.templateSpans) {
        take(span.expression);
        const literal = span.literal;
        spans.set(literal.getStart() + 1, literal.getEnd() - (ts.isTemplateTail(literal) ? 1 : 2));
      }
      return;
    } else if (ts.isIdentifier(node)) {
      const initializer = declared.get(node.text);
      if (initializer && !visited.has(node.text)) {
        visited.add(node.text);
        take(initializer);
      }
      return;
    } else if (ts.isPropertyAssignment(node)) {
      // An object of class strings: the values are classes, the keys are not.
      take(node.initializer);
      return;
    } else if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ts.SyntaxKind.GreaterThanToken,
        ts.SyntaxKind.LessThanToken,
      ].includes(node.operatorToken.kind)
    ) {
      // A comparison decides which class is used; its sides are values, not classes.
      return;
    } else if (ts.isElementAccessExpression(node)) {
      take(node.expression);
      return;
    } else if (ts.isConditionalExpression(node)) {
      take(node.whenTrue);
      take(node.whenFalse);
      return;
    } else if (ts.isCallExpression(node)) {
      // `cn(...)` and friends: the arguments are classes. A call on a string (`.replace`) is not.
      if (ts.isIdentifier(node.expression)) for (const argument of node.arguments) take(argument);
      return;
    }
    ts.forEachChild(node, take);
  };
  const walk = (node) => {
    if (ts.isJsxAttribute(node) && /^(className|[a-z]+ClassName)$/.test(node.name.getText()) && node.initializer)
      take(node.initializer);
    ts.forEachChild(node, walk);
  };
  walk(tree);
  if (wholeFile) for (const initializer of declared.values()) take(initializer);
  if (spans.size === 0) continue;
  let next = source;
  for (const [start, end] of [...spans].toSorted((a, b) => b[0] - a[0])) {
    next = next.slice(0, start) + prefixed(next.slice(start, end), name) + next.slice(end);
  }
  if (next !== source) {
    console.log(`${write ? "wrote" : "would change"} ${name} (${spans.size} strings)`);
    if (write) writeFileSync(file, next);
  }
}
console.log(`\n${seen.size} distinct classes, ${[...seen.values()].reduce((a, b) => a + b, 0)} uses`);
if (odd.length) console.log("ODD TOKENS:\n" + [...new Set(odd)].join("\n"));
if (!write) console.log([...seen.keys()].toSorted().join(" "));
