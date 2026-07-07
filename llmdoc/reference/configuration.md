# Reference — Configuration & Command

All settings live under the `expl3` configuration section (`package.json`
`contributes.configuration`) and are read live via `getConfiguration("expl3")`
on each lint (no reload needed). See `architecture/diagnostics-runtime.md` for
how each is consumed.

## `expl3.check.*` settings

| Setting | Type | Default | Meaning | Maps to explcheck arg |
|---|---|---|---|---|
| `expl3.check.enable` | boolean | `true` | Enable explcheck diagnostics. Gates `lint()`; disabling does **not** clear existing diagnostics. | — (runtime gate) |
| `expl3.check.path` | string | `explcheck` | Path to the executable. Empty string falls back to `explcheck`. | — (the `exe`) |
| `expl3.check.run` | enum `onSave` / `onType` / `manual` | `onSave` | When to run. **Only the `onType` branch reads this**; open/save always lint (see edge case below). | — (runtime trigger) |
| `expl3.check.debounce` | number (min 100) | `400` | Debounce (ms) for `onType`. Runtime enforces a hard floor of 100 ms. | — |
| `expl3.check.maxLineLength` | number | `0` | Max line length before `s103`. `0` = explcheck default (80). | `--max-line-length <n>` (only if > 0) |
| `expl3.check.ignoredIssues` | string[] | `[]` | Issue ids/prefixes to suppress, e.g. `["s103", "w2"]`. | `--ignored-issues <csv>` (only if non-empty) |
| `expl3.check.makeAtLetter` | boolean | `false` | Tokenize `@` as a letter (catcode 11), like `.sty`. | `--make-at-letter` (only if true) |

Always-passed args (not user-configurable): `--porcelain`, `--error-format`
`"%f:%l:%c:%e:%k: %t%n %M"`, and the target file path (positional, last).

### `check.run` edge case

Despite the `manual` `enumDescription` ("Only run explcheck via the command"),
open/save still lint in `manual` mode — the mode is consulted only for `onType`.
See `memory/doc-gaps.md`.

## Command

- `expl3.check.run` — title **"expl3: Run explcheck on the active file"**. Lints
  the active editor's document on demand. Works even in `manual` mode; still
  honors `check.enable` and the lintable-document gate.

## `.explcheckrc`

Checks run from the workspace-root cwd, so a project-level `.explcheckrc` at the
root applies to files in subdirectories (explcheck only searches its cwd, not
upward). See `architecture/diagnostics-runtime.md` (`execCwd`).

## Supported file types

- **Highlighting**: `.tex`, `.sty`, `.cls`, `.dtx`, `.expl` — wherever the host
  grammar produces a `text.tex.*` scope (or `source.expl3` for `.expl`).
- **Diagnostics (lintable)**: language ids `latex`, `latex-expl3`, `tex`, `expl3`
  on `file://` URIs, **excluding** `.dtx` and `.ins`.
