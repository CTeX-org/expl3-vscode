# Documentation Gaps & Open Questions

Open documentation/verification gaps — verify before acting. Resolved items are
removed once captured elsewhere.

## Resolved

- The three runtime gaps (manual-mode gate, debounce-timer cleanup, `execFile`
  timeout) are **resolved in v0.2.4** and documented in
  `architecture/diagnostics-runtime.md` + `CHANGELOG.md`.
- The CI `node-version` pin question is decided — see
  `memory/decisions/no-ci-node-pin.md`.

## Open

- **Grammar host-scope coverage gap.** The grammar regression test injects only
  into the `text.tex.doctex` host scope, so it exercises the injection
  *patterns* but not every host-scope wiring (`text.tex.latex`,
  `text.tex.latex-expl3`, `source.expl3`). Consider whether the other host
  scopes need coverage.
- **Local build artifacts on disk (not tracked).** The working tree can contain
  a `dist/` and a root `expl3-vscode-*.vsix`; `git ls-files` confirms neither is
  tracked — `.gitignore` ignores `dist` and `*.vsix`. These are stale local
  build outputs, safe to delete or rebuild. (`images/diagnostics.svg` is
  excluded from the package by `.vscodeignore` but is intentionally tracked in
  git as a README asset.)
