# Changelog

## [0.2.5] - 2026-07-14

### Fixed

- expl3 tokens inside `%` comments are no longer recolored (issue #1). In
  `.tex`/`.sty`/`.cls` files, commented-out expl3 code kept its expl3 colors
  instead of turning comment-gray. The injection selector now carries
  `-comment`, so the injection skips any scope the host already marks as a
  comment. `.dtx` doc lines (where the leading `%` is a DocStrip prefix, not a
  comment for the rest of the line) keep their expl3 highlighting, and docstrip
  guards like `%<*driver>` still highlight everywhere.
- Bare `.expl` files now really get expl3 coloring. The `source.expl3` host was
  listed in `package.json` `injectTo` but missing from the grammar's
  `injectionSelector`, so vscode-textmate never applied the injection there —
  only the base grammar's generic TeX colors showed. `source.expl3` is now in
  the selector as well.
- The published `.vsix` no longer ships dev-only files. `.vscodeignore` now
  excludes `llmdoc/`, `.llmdoc-tmp/`, and `.claude/`, which were previously
  packaged. The extension shrinks from 47 files (~925 KB) to 11 (~22 KB) — only
  the grammars, compiled `dist/`, icon, and docs.

## [0.2.4] - 2026-07-07

### Fixed

- `expl3.check.run: manual` now really means manual: opening or saving a file no
  longer runs explcheck in that mode. Previously only live (as-you-type) checking
  was suppressed, so open/save still linted despite the setting.
- A hung or slow `explcheck` run is now bounded by a 30 s timeout, so a dirty
  buffer's temporary file can no longer leak if the process never returns.
- Pending debounced checks are cancelled when the extension is deactivated.

## [0.2.3] - 2026-07-06

### Added

- Bare `.expl` files are now highlighted: the extension registers an `expl3`
  language and a base grammar, giving the injection a host scope. Previously
  `.expl` files got no highlighting (they had no LaTeX host grammar).
- CI now runs a grammar regression test (`tests/grammar.test.mjs`) that
  tokenizes fixtures and asserts the expected scopes, including the negated
  docstrip forms fixed in 0.2.2.
- README badges and a bug-report issue template.

## [0.2.2] - 2026-07-06

### Fixed

- docstrip guards with a negated expression — `%<*!driver>`, `%</!spa>`,
  `%<+!driver>` — were not highlighted. The marker (`*`/`/`/`+`/`-`) and the
  boolean expression (which may start with `!` or `(`) are now matched
  separately, so all docstrip forms highlight correctly.

## [0.2.1] - 2026-07-06

### Added

- Diagnostic codes are now clickable and link to the relevant `explcheck`
  documentation (the phase-specific rule reference).
- `.explcheckrc` project config is respected: checks run from the workspace
  root, so a root-level config applies to files in subdirectories.

### Changed

- Declared `extensionKind: ["workspace"]` so diagnostics work correctly in
  Remote-SSH / Dev Containers (explcheck runs on the workspace side).
- Settings use `markdownDescription` for richer links and formatting.
- README gains a diagnostics screenshot and an as-you-type / `.explcheckrc` note.

## [0.2.0] - 2026-07-06

### Added

- **explcheck diagnostics.** Runs [`explcheck`](https://ctan.org/pkg/expltools)
  on expl3 files and reports issues as editor squiggles, mapped by severity
  (`e`/`t` → Error, `w` → Warning, `s` → Information) with precise ranges.
  - Triggers: on save (default), on type (debounced), or manual command.
  - Dirty buffers are linted via a temp file (explcheck reads no stdin).
  - Graceful one-time prompt when explcheck is missing; highlighting is
    unaffected.
  - `.dtx` / `.ins` excluded from linting (explcheck can't process them yet,
    see explcheck issue #20); highlighting still applies.
  - Settings: `expl3.check.{enable,path,run,debounce,maxLineLength,ignoredIssues,makeAtLetter}`.
  - Command: **expl3: Run explcheck on the active file**.

## [0.1.0] - 2026-07-06

### Added

- Initial injection grammar covering:
  - expl3 public API families (`\tl_new:N`, `\prop_gput:Nnn`, ...).
  - Variable prefixes (`\l_...`, `\g_...`, `\c_...`).
  - Module-private commands under `%<@@=name>` guard (`\@@_foo:Nn`).
  - Quarks / scan marks / well-known constants (`\q_stop`, `\c_true_bool`, ...).
  - docstrip guard tags (`%<*driver>`, `%</...>`, `%<@@=module>`, `%<+!driver>`, ...).
- Injects into `text.tex.latex`, `text.tex.doctex`, `text.tex.latex-expl3`
  so `.tex/.sty/.cls/.dtx/.expl` all light up automatically alongside LaTeX Workshop.
