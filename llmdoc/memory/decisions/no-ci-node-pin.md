# Decision — Do not pin `node-version` in CI

## Decision

Do **not** set an explicit `node-version` in `.github/workflows/ci.yml` or
`.github/workflows/release.yml`. Rely on `actions/setup-node@v6` plus the
GitHub runner's current LTS Node.

## Context

Both workflows run a version-insensitive build: esbuild bundling, `tsc
--noEmit`, `vsce package`, and a `node:`-only test (`tests/grammar.test.mjs`
uses only built-in modules). None of these depend on a specific Node major.

## Rationale

- Pinning a hard number (e.g. `20`) invites EOL churn: the pin has to be
  chased forward as majors go end-of-life. Node 20 already emits deprecation
  warnings in GitHub Actions.
- The build has no version-specific requirements, so tracking the runner's
  default LTS is safe and lower-maintenance.

## Consequences

- The effective Node version can move as GitHub updates its runners; this is
  acceptable because the build is version-insensitive.
- If a specific version ever becomes necessary, prefer `lts/*` over a hard
  number to avoid the EOL-churn problem again.
