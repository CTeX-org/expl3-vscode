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

- **Grammar test still uses one stub host.** `tests/grammar.test.mjs` mounts a
  single stub under `text.tex.doctex`; it does not tokenize through the real
  LaTeX Workshop grammars for each host (`text.tex.latex`, `.doctex`,
  `source.expl3`). The `.dtx`-no-regression and `.sty`-comment checks were done
  ad hoc against the installed LaTeX Workshop (see the issue-1 scratch report),
  not in CI. Closure: either vendor minimal host fixtures or add an
  opt-in test that points at `$LW`.
- **Local build artifacts on disk (not tracked).** The working tree can contain
  a `dist/` and a root `expl3-vscode-*.vsix`; `git ls-files` confirms neither is
  tracked — `.gitignore` ignores `dist` and `*.vsix`. These are stale local
  build outputs, safe to delete or rebuild. (`images/diagnostics.svg` is
  excluded from the package by `.vscodeignore` but is intentionally tracked in
  git as a README asset.)
