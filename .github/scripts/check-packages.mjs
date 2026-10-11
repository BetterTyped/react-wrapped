/* oxlint-disable no-console -- a command line tool says what it found */
// Checks every published package the way someone installing it would meet it: packed, then linted (publint) and
// its types resolved under Node's own ESM rules (attw). Run after a build, from the repository root:
//
//   node .github/scripts/check-packages.mjs
//
// The packages are ESM only, which is said to attw so it does not report the missing CommonJS build as a problem.
import { execFileSync } from "node:child_process";

const list = execFileSync("node", [".github/scripts/packages.mjs", "list"], { encoding: "utf8" });
const packages = list
  .split("\n")
  .filter(Boolean)
  .map((line) => line.split("\t")[0]);

let failed = 0;
for (const dir of packages) {
  for (const [name, args] of [
    ["publint", ["exec", "publint", dir, "--strict"]],
    // A stylesheet has no types to resolve, so that entry is left out of the types check.
    ["attw", ["exec", "attw", "--pack", dir, "--profile", "esm-only", "--exclude-entrypoints", "styles.css"]],
  ]) {
    try {
      execFileSync("pnpm", args, { stdio: "pipe", encoding: "utf8" });
      console.log(`ok    ${name}  ${dir}`);
    } catch (error) {
      failed += 1;
      console.log(`FAIL  ${name}  ${dir}\n${error.stdout ?? ""}${error.stderr ?? ""}`);
    }
  }
}
if (failed > 0) {
  console.log(`\n${failed} check${failed === 1 ? "" : "s"} failed.`);
  process.exit(1);
}
console.log(`\n${packages.length} packages, all well formed.`);
