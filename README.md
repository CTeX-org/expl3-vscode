# expl3 (LaTeX3) Syntax Highlighting

Syntax highlighting for **expl3** (the LaTeX3 programming layer) in Visual Studio Code.

Files full of expl3 code — `xeCJK.dtx`, `expl3.dtx`, your own `.sty`/`.cls` — normally
render as a wall of undifferentiated `\command` text. This extension adds a semantic
layer on top so the pieces that actually carry meaning stand out.

![expl3 highlighting before / after](https://raw.githubusercontent.com/CTeX-org/expl3-vscode/main/images/before-after.png)

## What gets highlighted

| Layer | Examples | TextMate scope |
|-------|----------|----------------|
| **API families** | `\tl_new:N`, `\prop_gput:Nnn`, `\cs_new_protected:Npn` | `support.function.expl3` |
| **Variables** (`l_`/`g_`/`c_`) | `\l_tmpa_tl`, `\g_@@_state_bool`, `\c_novalue_tl` | `variable.other.expl3` |
| **Private commands** (`@@`) | `\@@_do_thing:Nn`, `\@@_state_bool` | `entity.name.function.private.expl3` |
| **Quarks / scan marks / constants** | `\q_stop`, `\s_stop`, `\c_true_bool` | `constant.language.expl3` |
| **docstrip guards** | `%<*driver>`, `%</package>`, `%<@@=xeCJK>`, `%<+!driver>` | `entity.name.tag.docstrip.expl3` |

Colors come from your active color theme — the extension only assigns scopes, so it
looks native in Dark+, Light+, Solarized, and everything else.

## Requirements

This is an **injection grammar**: it layers on top of an existing LaTeX grammar rather
than replacing it. You need a LaTeX language extension that provides the
`text.tex.latex` / `text.tex.doctex` scopes — most commonly:

> **[LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop)** (`James-Yu.latex-workshop`)

Without such a host extension there is no base grammar to inject into, and this
extension does nothing on its own. That is by design — injection grammars are additive.

## How it works

```
your .dtx / .sty / .tex file
│
├─ Layer 1 — LaTeX Workshop (host grammar)
│    .dtx      → text.tex.doctex   (macrocode blocks, DocTeX structure)
│    .sty/.cls → text.tex.latex
│    colors \begin/\end, % comments, generic \commands, math, environments
│
└─ Layer 2 — expl3-vscode (this extension, injected on top)
     recolors the expl3-specific tokens the host leaves as generic macros:
     :Nn functions · l_/g_/c_ variables · @@ privates · quarks · docstrip tags
```

TextMate injections are **additive**, so the two layers never fight — the host paints
the general structure and this extension refines the expl3 tokens.

## Supported files

`.tex` · `.sty` · `.cls` · `.dtx` · `.expl` — anywhere the host grammar produces a
`text.tex.*` scope, expl3 tokens light up automatically. No `files.associations`
configuration needed.

## Installation

Install **LaTeX Workshop** and **expl3 Syntax Highlighting** from the Extensions view
(<kbd>Ctrl/Cmd</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>), then reload the window.

## Contributing

Grammar lives in [`syntaxes/expl3.tmLanguage.json`](syntaxes/expl3.tmLanguage.json);
a representative regression sample is in
[`tests/fixtures/xeCJK-sample.dtx`](tests/fixtures/xeCJK-sample.dtx). Issues and PRs
welcome at <https://github.com/CTeX-org/expl3-vscode>.

## License

[MIT](LICENSE)
