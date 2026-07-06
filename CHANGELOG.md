# Changelog

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
