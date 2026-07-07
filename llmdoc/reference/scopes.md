# Reference — TextMate Scope Catalog

For theme authors and grammar maintainers. All scopes are assigned by the
injection grammar `syntaxes/expl3.tmLanguage.json` (`scopeName: expl3.injection`).
Colors come from the active theme; the extension only assigns scopes. See
`architecture/grammar-injection.md` for the regex and match-order details.

## Token → scope

| Token category | TextMate scope | Examples |
|---|---|---|
| Public API families | `support.function.expl3` | `\tl_new:N`, `\prop_gput:Nnn`, `\cs_new_protected:Npn` |
| Variables (`l_`/`g_`/`c_`) | `variable.other.expl3` | `\l_tmpa_tl`, `\g_@@_state_bool` |
| Private commands (`@@`) | `entity.name.function.private.expl3` | `\@@_do_thing:Nn`, `\@@_state_bool` |
| Quarks / scan marks / constants | `constant.language.expl3` | `\q_stop`, `\s_stop`, `\c_true_bool`, `\c_novalue_tl` |
| docstrip block/inline guard body | `entity.name.tag.docstrip.expl3` | `%<*driver>`, `%</package>`, `%<+!driver>`, `%<*driver&!final>` |
| docstrip module-guard name | `entity.name.tag.docstrip.module.expl3` | the `xeCJK` in `%<@@=xeCJK>` |

## docstrip guard sub-scopes

Within a docstrip guard the punctuation is further scoped:

| Piece | Scope |
|---|---|
| `%` | `punctuation.definition.comment.tex` |
| `<` and `>` | `punctuation.definition.tag.docstrip.expl3` |
| `@@` (module guard) | `keyword.other.docstrip.at.expl3` |
| `=` (module guard) | `punctuation.separator.docstrip.expl3` |
| direction marker `*` `/` `+` `-` | `keyword.operator.docstrip.marker.expl3` |

## Base grammar scopes (`source.expl3`, `.expl` only)

From `syntaxes/expl3-base.tmLanguage.json` (host tokens, not expl3-specific):

| Token | Scope |
|---|---|
| `%…` line comment | `comment.line.percentage.tex` |
| control sequence / single-char escape | `constant.character.escape.tex` |
| `{` `}` | `punctuation.definition.group.tex` |
