# Working Agreement

## Language conventions

- **Communication with the user is in Chinese** (Simplified, Mandarin).
- **All documents are written in English** — `llmdoc/`, `README.md`, design
  docs, issues, and PR descriptions. (Note: the user-facing README is Chinese
  in some projects, but *this* project's docs, including this file, are English.)
- **Code comments and commit messages are in English** — inline/block comments,
  commit subjects/bodies.
- Keep technical names, API names, file paths, and code references untranslated.

## Tooling

- To read GitHub issue/PR state and comments, use the `gh` CLI (e.g.
  `gh issue view N --repo O/R --comments`/`--json`), not `WebFetch` — GitHub
  renders comments dynamically and a plain HTML fetch can miss them.

## Before non-trivial work

- Align with the user before non-trivial plans or edits.
- Prefer the llmdoc subagents when they fit: `investigator` for exploration,
  `recorder` for stable docs, `worker` for scoped implementation, `reflector`
  for process lessons.

## After changes

- **After any grammar change** (`syntaxes/*.tmLanguage.json`), run `npm test`.
  Add both a positive and a negative case to `tests/grammar.test.mjs` first.
- After non-trivial edits, update `README.md`, the design docs, and run
  `/llmdoc:update` to keep `llmdoc/` in sync.
- Never edit the shipped `dist/extension.js` by hand — edit `src/extension.ts`
  and recompile.
