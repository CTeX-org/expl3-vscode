# Documentation Gaps & Open Questions

Open questions and weak spots surfaced during the initial investigation. These
are documentation/verification gaps, not confirmed bugs — verify before acting.

## Runtime behavior

- **RESOLVED — `check.run: manual` now suppresses open/save linting.**
  `src/extension.ts` routes open/save (and the initial scan) through `lintAuto`,
  which returns early when `runMode() === "manual"`. Behavior now matches the
  `package.json` `enumDescription`. The `expl3.check.run` command still works in
  `manual` mode.
- **RESOLVED — debounce timers cleared on dispose.** A disposable registered in
  `context.subscriptions` clears all pending `debounceTimers` on deactivation.
- **RESOLVED — `execFile` timeout added.** Both spawns use
  `timeout: EXEC_TIMEOUT_MS` (30 s). On timeout execFile still fires the callback,
  so a hung `explcheck` is bounded and the dirty-buffer temp file is still
  unlinked (no leak).

## CI / packaging

- **DECIDED — do not pin `node-version`.** `ci.yml` / `release.yml` intentionally
  leave `setup-node@v6` unpinned and rely on the runner's current LTS. Pinning a
  hard number (e.g. `20`) invites EOL churn — Node 20 already emits deprecation
  warnings in GitHub Actions — and the build (esbuild + tsc + `vsce package` +
  a `node:`-only test) is version-insensitive. If a specific version ever becomes
  necessary, prefer `lts/*` over a hard number.
- **Local build artifacts on disk (not tracked).** The working tree contains a
  `dist/` and a root `expl3-vscode-0.2.1.vsix`, but `git ls-files` confirms
  neither is tracked — `.gitignore` correctly ignores `dist` (line 83) and
  `*.vsix` (line 146). These are stale local build outputs (the VSIX is `0.2.1`
  while `package.json` is `0.2.3`); safe to delete or rebuild. No git
  contradiction. (`images/diagnostics.svg` is excluded from the package by
  `.vscodeignore` but is intentionally tracked in git as a README asset.)

## Coverage gaps

- The grammar regression test injects only into the `text.tex.doctex` host scope,
  so it exercises the injection *patterns* but not every host-scope wiring
  (`text.tex.latex`, `text.tex.latex-expl3`, `source.expl3`). Consider whether
  the other host scopes need coverage.
