# gh-assets

Orphan branch holding issue-related assets (MWEs, screenshots, rendered
comparisons) referenced from GitHub issues and PRs, kept out of the main
branch history. Modeled after ctex-kit's asset-branch usage.

## Contents

- `issue-1/` — [issue #1](https://github.com/CTeX-org/expl3-vscode/issues/1):
  commented-out expl3 code was still highlighted with expl3 colors.
  - `mwe.sty` — the minimal example from the report.
  - `before-after.svg` / `before-after.png` — tokenization of the MWE through
    the real LaTeX Workshop `text.tex.latex` grammar, before (v0.2.4) vs after
    the `-comment` injection-selector fix.
  - `render.mjs` — the script that produced the comparison (needs
    vscode-oniguruma/vscode-textmate and a LaTeX Workshop install, see `LW`).
