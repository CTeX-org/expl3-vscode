# Architecture — Grammar Injection Model

Highlighting is grammar-only (no runtime code). It is a TextMate **injection**
grammar: it *adds* scopes on top of an existing LaTeX grammar rather than
replacing it.

## Two-layer model

```
your .dtx / .sty / .tex / .expl file
│
├─ Layer 1 — host LaTeX grammar
│    .dtx      → text.tex.doctex
│    .sty/.cls → text.tex.latex
│    .expl     → source.expl3  (this extension's own base grammar)
│    paints \begin/\end, % comments, generic \commands, math, environments
│
└─ Layer 2 — expl3.injection (this extension, injected on top)
     recolors expl3-specific tokens the host leaves as generic macros
```

Because injections are **additive**, the two layers never conflict: the host
paints the general structure, and this extension refines the expl3 tokens.

For `.tex`/`.sty`/`.cls`/`.dtx` the host must come from another extension (e.g.
LaTeX Workshop, which produces `text.tex.latex` / `text.tex.doctex`). Without
such a host there is nothing to inject into and highlighting does nothing — by
design. The only self-sufficient case is `.expl` (see base grammar below).

## Registration: `injectionSelector` vs `injectTo`

Two places declare where the injection attaches:

- **In the grammar file** `syntaxes/expl3.tmLanguage.json`:
  - `scopeName`: `expl3.injection`.
  - `injectionSelector`: `L:text.tex.latex -comment, L:text.tex.doctex -comment,
    L:text.tex.latex-expl3 -comment, L:source.expl3 -comment`.
    (`L:` = inject to the left / on top of the host; `-comment` = skip tokens
    the host already scopes as a comment.)
- **In `package.json`** `contributes.grammars[].injectTo`:
  `text.tex.latex`, `text.tex.doctex`, `text.tex.latex-expl3`, `source.expl3`.

Both lists must name the same hosts. `injectTo` registers the injection with
VS Code (which scopes get it at all); the in-grammar `injectionSelector` is the
matcher vscode-textmate actually evaluates per token position. **A host listed
only in `injectTo` never matches** — that was the v0.2.4 `.expl` bug:
`source.expl3` was in `injectTo` but missing from `injectionSelector`, so bare
`.expl` files silently got no expl3 coloring (fixed in v0.2.5).

### The `-comment` exclusion (issue #1, v0.2.5)

Every selector carries `-comment`, so the injection does not recolor tokens the
host already scopes as a comment:

- `.tex`/`.sty`/`.cls` (`text.tex.latex`): the host scopes the whole `% ...`
  line `comment.line.percentage.tex`, so commented-out expl3 code now stays
  comment-gray (this was issue #1: it used to keep full expl3 colors).
- `.dtx` (`text.tex.doctex`): the host's comment rule only scopes the leading
  `%` prefix characters themselves (`comment.line.percentage.doctex`), NOT the
  rest of the line — a `%` in doctex is the DocStrip prefix, not a comment. So
  expl3 code after `% ` in `.dtx` keeps its coloring, which is the intended
  DocTeX behavior. Inside `macrocode` blocks the content is `text.tex.latex`,
  so a real `%` comment there goes gray as expected.
- docstrip guards (`%<*driver>` etc.) still highlight in all hosts: the `L:`
  injection is evaluated before the host's comment rule consumes the line, so
  at line start the scope list does not yet contain `comment`.

The top-level `patterns` of the injection grammar are just two:
`#docstrip-guard` and `#expl3-macro`.

## Base grammar `expl3-base.tmLanguage.json` (`source.expl3`)

A tiny (~28-line) grammar registered for the `expl3` language (`.expl`). Its only
purpose is to give bare `.expl` files a `text.tex`-style host so the injection has
something to attach to. It provides only the most basic TeX tokens:

- `%.*$` → `comment.line.percentage.tex`
- `\\[A-Za-z@_:]+` → `constant.character.escape.tex` (control sequences)
- `\\.` → `constant.character.escape.tex` (single-char escape)
- `[{}]` → `punctuation.definition.group.tex`

The fine-grained expl3 coloring is NOT here — it comes from `expl3.injection`
attaching via the `source.expl3` entry in `injectTo`.

## Token categories, scopes, and regex subtleties

Inside `#expl3-macro` the patterns run in a **fixed order** that is a correctness
dependency (see next section):

1. **Quarks / scan marks / constants** → `constant.language.expl3`
   (repo key `expl3-quark-scan-const`).
   `\q_...` and `\s_...` match any name; `\c_...` is a **whitelist** of known
   constants (`\c_true_bool`, `\c_novalue_tl`, `\c_empty_tl`, `\c_max_int`, …).
   Subtlety: `\c_novalue_tl`/`\c_true_bool` are constants, not variables — they
   must be caught here *before* the variable-prefix rule.
2. **Private `@@` commands** → `entity.name.function.private.expl3`
   (`expl3-private-at-at`): `\@@_[A-Za-z0-9_]*(:sig)?`. Matches
   `\@@_do_thing:Nn`, `\@@_state_bool`, `\@@_`.
3. **Public API families** → `support.function.expl3`
   (`expl3-api-family`): `\<family>_<name>(:sig)?` where `<family>` is a fixed
   whitelist of ~41 module names (`tl`, `clist`, `seq`, `prop`, `int`, `str`,
   `cs`, `exp`, `fp`, `regex`, `msg`, `keys`, …). The `:sig` part is optional.
4. **Variable prefixes `l_`/`g_`/`c_`** → `variable.other.expl3`
   (`expl3-variable-prefix`): `\[lgc]_[_A-Za-z@][A-Za-z0-9_@]*(:sig)?`. Matches
   `\l_tmpa_tl`, `\g_@@_state_bool`, `\g__ctex_state_bool`, `\c_@@_marker_tl`.
   Allows `@` (module-private) and leading `_` (double underscore) in names.

docstrip guards (in `#docstrip-guard`, which runs before `#expl3-macro`):

- **Module guard** `%<@@=name>` → module name scoped
  `entity.name.tag.docstrip.module.expl3`, with the `%`, `<`, `>`, `@@`, `=`
  each scoped as comment/tag/keyword/separator punctuation.
- **Block/inline guard** `%<*expr>` / `%</expr>` / `%<+expr>` / `%<expr>` →
  the boolean expression body scoped `entity.name.tag.docstrip.expl3`, the
  direction marker (`* / + -`) scoped `keyword.operator.docstrip.marker.expl3`.

### The docstrip negated-expression fix (v0.2.2, commit `3f95aca`)

The old block-guard regex was `([*/+!-]?) ([A-Za-z_][A-Za-z0-9_|&!,+-]*)`. Because
`!` was in the **marker** character class, in `%<*!driver>` the `*` was consumed
as the marker, then `!` did not match the expression's first-char class
`[A-Za-z_]`, so the whole guard failed and fell back to plain text. The fix
narrows the marker to `[*/+-]?` (no `!`) and widens the expression's first-char
class to `[A-Za-z_!(]` (adding `()` to the body):
`^ (%) (<) ([*/+-]?) ([A-Za-z_!(][A-Za-z0-9_|&!,+()-]*) (>)`. Now `%<*!driver>`,
`%</!spa>`, `%<+!driver>`, and `%<*driver&!final>` all highlight correctly.

## Match order is a correctness invariant

The order **const → @@ → api → var** must be preserved:

- The constant whitelist (`\c_true_bool`, `\c_novalue_tl`, …) must match before
  the `\c_`-variable rule, otherwise those constants would be miscolored as
  variables.
- `@@` privates must match before the broader API/variable rules.

Changing the order silently breaks coloring; always add a positive + negative
test (`tests/grammar.test.mjs`) when touching these patterns. See
`guides/adding-grammar-tokens.md`.

## `language-configuration.json`

Applies only to the `expl3` language (`.expl`), via `contributes.languages`:

- `comments.lineComment`: `%`
- `brackets` / `autoClosingPairs` / `surroundingPairs`: `{}` and `[]`
- No blockComment; `\` and `$` are not configured as brackets.
