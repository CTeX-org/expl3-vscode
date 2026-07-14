# Issue #1 — Comment Highlighting Fix

## Task
- Fixed issue #1: commented-out expl3 code in `.tex`/`.sty`/`.cls` kept its
  expl3 colors instead of turning comment-gray. Root cause: the
  `injectionSelector` had no `-comment` exclusion, so the injection recolored
  tokens the host already scoped as `comment.line.percentage.*`.
- Added `-comment` to every selector entry; also added the missing
  `L:source.expl3` selector entry (latent `.expl` bug).
- Committed on `main` (fix + docs), pushed a `gh-assets` orphan branch with the
  MWE + before/after render, and commented on the issue with the comparison.

## What Went Right (keep doing)
- Reproduced through the *real* LaTeX Workshop grammar chain (vscode-textmate +
  vscode-oniguruma) before and after, and ran a tokenization **diff** over the
  `.dtx` fixtures to prove zero regression — not just "looks fine."
- Wrote the negative test against the OLD grammar first to confirm it actually
  fails (3 failures), then confirmed the fix makes it pass. A negative test that
  never fails on the buggy code proves nothing.

## Durable Lessons
- **`injectTo` (package.json) and `injectionSelector` (grammar) must list the
  same host scopes.** `injectTo` only *registers* the injection with VS Code;
  the in-grammar `injectionSelector` is what vscode-textmate evaluates per
  token. A host in `injectTo` but not the selector silently never matches. This
  bit `.expl` in v0.2.4. Promoted to `architecture/grammar-injection.md`.
- **A TextMate injection recolors inside host comments unless the selector
  excludes them.** Use `-comment` (or a more specific scope) in the selector.
  DocTeX is the subtle case: its comment rule scopes only the leading `%`
  prefix, so `.dtx` code after `% ` is NOT a comment token and keeps coloring —
  which is the intended DocStrip behavior.
- **No node/npm on PATH? Two options, in order:** (1) `brew install node` for a
  real toolchain (preferred — `npm test`/`tsc`/`compile` all work); (2) as a
  stopgap, VS Code's Electron runs `.mjs` via
  `ELECTRON_RUN_AS_NODE=1 "/Applications/Visual Studio Code.app/Contents/MacOS/Electron" file.mjs`,
  with `node_modules/vscode-{oniguruma,textmate}` symlinked from the app bundle.

## Promotion Candidates
- Already promoted: injectTo/selector contract + `-comment` semantics into
  `architecture/grammar-injection.md` and README (commit in this task).
- Consider a one-line note in `guides/adding-grammar-tokens.md` that changing
  host scopes means editing BOTH lists (the guide already says this; the new
  lesson is that a selector-only omission fails silently).
