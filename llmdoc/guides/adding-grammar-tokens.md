# Guide — Adding or Adjusting a Highlighted Token

Use this when you want a new expl3 token category to be highlighted, or when you
adjust an existing regex. Background: `architecture/grammar-injection.md`;
scope names: `reference/scopes.md`.

## Steps

1. **Edit `syntaxes/expl3.tmLanguage.json`.** Add or change a pattern under the
   right repository key:
   - new expl3 macro form → a pattern inside `#expl3-macro`;
   - new docstrip guard form → a pattern inside `#docstrip-guard`.
   Assign a scope from the catalog in `reference/scopes.md`, or a well-known
   TextMate scope so themes color it.

2. **Respect match order.** Inside `#expl3-macro` the order
   **const → @@ → api → var** is a correctness invariant: whitelisted constants
   must match before the `\c_` variable rule, and `@@` before the broader API/
   variable rules. Insert new patterns so this ordering still holds.

3. **Add BOTH a positive and a negative case** to `tests/grammar.test.mjs`:
   - positive: append `[line, scopeSubstring]` to `CASES` — passes if any token
     scope on that line *contains* the substring.
   - negative: append `[line, scopeSubstring]` to `NEGATIVE` — the substring must
     NOT appear (this is what catches over-matching / order regressions).

4. **Run the test**: `npm test` (runs `tests/grammar.test.mjs`). It exits non-zero
   on any failure. The test uses an inline stub host (`text.tex.doctex`), so no
   LaTeX Workshop is needed.

5. **Validate JSON if in doubt**: `node -e "JSON.parse(require('fs').readFileSync('syntaxes/expl3.tmLanguage.json'))"`
   — this is exactly what CI does first.

6. **Regenerate preview images if the visual changed** (optional, needs `$LW`
   pointing at a LaTeX Workshop dir): `node tests/render-preview.mjs` →
   `images/before-after.svg`; `node tests/render-diagnostics.mjs` (also needs
   `explcheck`) → `images/diagnostics.svg`. Convert SVG → PNG externally
   (README references the `.png` files).

## Notes

- Base grammar `expl3-base.tmLanguage.json` (`source.expl3`) is only host tokens
  for `.expl`; do not put expl3-specific coloring there — it belongs in the
  injection grammar.
- If you change which host scopes the injection attaches to, update **both**
  `injectionSelector` (in the grammar) and `injectTo` (in `package.json`), and
  remember `injectTo` intentionally also carries `source.expl3`. A host listed
  only in `injectTo` (not the selector) **fails silently** — VS Code registers
  the injection but vscode-textmate never matches it there (this was the
  v0.2.4 `.expl` bug, fixed in v0.2.5).
- The injection recolors tokens **inside host comments** unless the selector
  excludes them. Every `injectionSelector` entry carries `-comment` so
  commented-out expl3 code stays comment-colored (issue #1). Keep `-comment` on
  any host you add.
