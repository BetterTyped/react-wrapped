/* oxlint-disable no-console -- a command line tool says what it found */
// Installs the packed packages into a project outside this repository and uses them the way a stranger would:
// typechecked under Node's own module rules with library checking on, and rendered on the server by plain Node.
// Run after a build, from the repository root:
//
//   node .github/scripts/check-consumer.mjs
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const work = mkdtempSync(path.join(tmpdir(), "react-wrapped-consumer-"));
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: "pipe", encoding: "utf8" });

try {
  const packed = path.join(work, "packed");
  const project = path.join(work, "project");
  const packages = run("node", [".github/scripts/packages.mjs", "list"], root)
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t")[0]);
  for (const dir of packages) run("pnpm", ["pack", "--pack-destination", packed], path.join(root, dir));

  cpSync(path.join(root, "tools/consumer"), project, { recursive: true });
  const tarballs = Object.fromEntries(
    readdirSync(packed).map((file) => [
      // react-wrapped-kit-1.2.3.tgz is @react-wrapped/kit
      `@react-wrapped/${file.replace(/^react-wrapped-/, "").replace(/-\d[^-]*\.tgz$/, "")}`,
      `file:${path.join(packed, file)}`,
    ]),
  );
  writeFileSync(
    path.join(project, "package.json"),
    `${JSON.stringify(
      {
        name: "consumer",
        private: true,
        type: "module",
        dependencies: { ...tarballs, gsap: "^3.13.0", react: "^19.0.0", "react-dom": "^19.0.0" },
        devDependencies: { typescript: "^6.0.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0" },
      },
      null,
      2,
    )}\n`,
  );
  run("npm", ["install", "--no-audit", "--no-fund"], project);
  console.log(`installed ${Object.keys(tarballs).length} packed packages into a project outside the repository`);

  run("npx", ["tsc", "-p", "."], project);
  console.log("ok    types hold under NodeNext with library checking on");

  const rendered = run("node", ["ssr.mjs"], project).trim();
  if (!rendered.includes("has stage: true")) throw new Error(`The server render came out wrong: ${rendered}`);
  // A class given for a slot has to arrive on that part, through the packed packages too.
  if (!rendered.includes("has a restyled slot: true")) throw new Error(`A slot's class did not land: ${rendered}`);
  console.log(`ok    ${rendered}`);
} catch (error) {
  console.log(`FAIL\n${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? ""}`);
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
