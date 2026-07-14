# Documentation Gaps & Open Questions

Open documentation/verification gaps — verify before acting. Resolved items are
removed once captured elsewhere.

## Resolved

- The three runtime gaps (manual-mode gate, debounce-timer cleanup, `execFile`
  timeout) are **resolved in v0.2.4** and documented in
  `architecture/diagnostics-runtime.md` + `CHANGELOG.md`.
- The CI `node-version` pin question is decided — see
  `memory/decisions/no-ci-node-pin.md`.
- **Grammar host-scope coverage gap (partly resolved, v0.2.5).** The host-scope
  wiring is now understood and documented: a host must appear in BOTH
  `package.json` `injectTo` and the grammar `injectionSelector`, or it never
  matches (this was the `.expl` bug — `source.expl3` was only in `injectTo`).
  The grammar test's stub host now also carries a comment rule, so the
  `-comment` behavior is covered. See `architecture/grammar-injection.md`.

## Open

- **CI does not assert VSIX contents.** The `.vscodeignore` gap that shipped
  `llmdoc/`/`.claude/` inside the extension (fixed in v0.2.5) was invisible to
  CI: the package dry-run checks that packaging *succeeds*, not *what* it
  includes. Closure: add a CI assertion on `vsce ls` (e.g. fail if it lists
  anything under `llmdoc/`, `.llmdoc-tmp/`, `.claude/`, `src/`, or `tests/`).
- **Local build artifacts on disk (not tracked).** The working tree can contain
  a `dist/` and a root `expl3-vscode-*.vsix`; `git ls-files` confirms neither is
  tracked — `.gitignore` ignores `dist` and `*.vsix`. These are stale local
  build outputs, safe to delete or rebuild. (`images/diagnostics.svg` is
  excluded from the package by `.vscodeignore` but is intentionally tracked in
  git as a README asset.)
