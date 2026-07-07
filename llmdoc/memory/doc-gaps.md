# Documentation Gaps & Open Questions

Open questions and weak spots surfaced during the initial investigation. These
are documentation/verification gaps, not confirmed bugs — verify before acting.

## Runtime behavior — needs confirmation

- **`check.run: manual` still lints on open and save.** `src/extension.ts`
  consults the mode only in the `onDidChangeTextDocument` (onType) path;
  `onDidOpenTextDocument`/`onDidSaveTextDocument` call `lint` unconditionally.
  This contradicts the `package.json` `enumDescription` for `manual` ("Only run
  explcheck via the command"). Is this intended (then fix the description) or a
  bug (then gate open/save on the mode)? Unresolved.
- **Debounce timers are not registered in `context.subscriptions`.** A pending
  onType timer can fire after `deactivate`. Low impact; confirm whether to track
  and clear them on dispose.
- **No `execFile` timeout.** A hung/slow `explcheck` has no cap besides the 8 MiB
  `maxBuffer`, and for dirty buffers a hang leaves the temp file un-unlinked
  (leak). Confirm whether a timeout / cleanup guard is wanted.

## CI / packaging — needs confirmation

- **`setup-node@v6` pins no `node-version`** in `ci.yml` / `release.yml`. If a
  specific Node version matters, pin it rather than relying on the action default.
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
