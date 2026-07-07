# Project Basics

`expl3-vscode` is a VS Code extension published as `CTeX-org.expl3-vscode`
(also on Open VSX). It gives **expl3** (the LaTeX3 programming layer) two things:

1. **Syntax highlighting** — a TextMate *injection* grammar that recolors
   expl3-specific tokens on top of an existing LaTeX grammar.
2. **Diagnostics** — runs the external `explcheck` CLI and surfaces its
   static-analysis results as editor squiggles.

The two features are independent: highlighting works with no external tools;
diagnostics require `explcheck` on the machine and degrade gracefully if it is
missing.

## Key directories

- `src/extension.ts` — the entire TypeScript runtime (single file). Owns the
  explcheck diagnostics flow. Highlighting needs no runtime code.
- `syntaxes/` — the two TextMate grammars:
  - `expl3.tmLanguage.json` — the injection grammar (`scopeName: expl3.injection`).
  - `expl3-base.tmLanguage.json` — a tiny base grammar for bare `.expl` files
    (`scopeName: source.expl3`).
- `language-configuration.json` — comment/bracket config for the `expl3` language.
- `tests/` — `grammar.test.mjs` (the only `npm test`); render tools that emit
  README images; fixtures.
- `.github/workflows/` — `ci.yml` (push/PR) and `release.yml` (tag-driven).

## Build

- Bundled with **esbuild** to `dist/extension.js` (see `package.json` `compile`).
- `tsc` is type-check only (`npx tsc --noEmit`); it does not produce the shipped file.
- `vscode:prepublish` recompiles with `--minify` during `vsce package`/`publish`.
