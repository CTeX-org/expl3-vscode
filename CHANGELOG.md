# Changelog

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
