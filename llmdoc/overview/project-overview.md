# Project Overview

## Identity

`expl3-vscode` (marketplace id `CTeX-org.expl3-vscode`, also on Open VSX) is a
VS Code extension that supports **expl3**, the LaTeX3 programming layer. It has
two independent features:

1. **Syntax highlighting** via a TextMate *injection* grammar that recolors the
   expl3-specific tokens (`:Nn` API functions, `l_`/`g_`/`c_` variables, `@@`
   privates, quarks/constants, docstrip guards) which a plain LaTeX grammar
   leaves as undifferentiated `\command` text.
2. **Diagnostics** via the external `explcheck` CLI (from TeX Live `expltools`),
   shown as editor squiggles mapped by severity.

## Major areas

- **Runtime** (`src/extension.ts`) — the diagnostics flow only; highlighting
  needs no runtime code. See `architecture/diagnostics-runtime.md`.
- **Grammars** (`syntaxes/`) — the injection grammar plus a tiny base grammar
  for `.expl`. See `architecture/grammar-injection.md`.
- **Config surface** — the `expl3.check.*` settings and one command. See
  `reference/configuration.md`.
- **Delivery** — grammar regression test, push/PR CI, and a tag-driven,
  reviewer-gated release. See `reference/release-process.md`.

## Boundaries — what belongs

- Recoloring expl3 tokens on top of a host LaTeX grammar.
- Running `explcheck` on lintable expl3 files and mapping its output to
  diagnostics with clickable rule-doc links.
- Supporting Remote-SSH / WSL / dev containers by running on the workspace host
  (`extensionKind: ["workspace"]`), so `explcheck` and the files are co-located.

## Boundaries — what does NOT belong

- **No language server / no IntelliSense / no formatting.** The extension only
  provides scopes and shells out to `explcheck`; there is no LSP.
- **Injection-only: no host LaTeX grammar of its own** (except the minimal
  `source.expl3` base for `.expl`). Without a host extension producing
  `text.tex.*` (e.g. LaTeX Workshop), highlighting does nothing on `.tex`/
  `.sty`/`.cls`/`.dtx`. This is by design — injections are additive.
- **`.dtx` / `.ins` are not linted.** `explcheck` cannot process bundled sources
  yet (explcheck issue #20, planned for v1.1). Highlighting still applies to
  `.dtx`.
- **Non-`file` URIs are ignored** for diagnostics (explcheck needs a real
  on-disk path); untitled/virtual documents get no lint.
- No output channel or status bar — the runtime is silent except one missing-tool
  prompt.
