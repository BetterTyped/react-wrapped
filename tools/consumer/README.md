# The outside project

What someone who installs the library has: the packed tarballs, React, GSAP, and nothing from this repository.
`.github/scripts/check-consumer.mjs` copies this folder somewhere else, installs the tarballs into it, typechecks
`src/main.tsx` under Node's own module rules with library checking on, and renders a Wrapped on the server.

It exists because the checks inside the workspace cannot see some mistakes: a type that only resolves because the
workspace happens to import GSAP, an import that only a bundler would follow, a file left out of the package.
