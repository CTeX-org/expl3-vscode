# Startup Reading Order

Read these must-read docs at the start of every run, in order:

1. `must/project-basics.md` — what the extension is, key dirs, the two-feature
   split, how it builds.
2. `must/working-agreement.md` — language conventions, align-before-edits,
   run `npm test` after grammar changes, update docs after non-trivial edits.
3. `must/doc-routing.md` — quick "where do I look for X" table.

## Escalation

After the must-read set, pull in only what the task needs (routing table lives
in `must/doc-routing.md`):

- Touching the diagnostics runtime → `architecture/diagnostics-runtime.md`.
- Touching highlighting / grammars → `architecture/grammar-injection.md` (+
  `reference/scopes.md`, `guides/adding-grammar-tokens.md`).
- Settings / command questions → `reference/configuration.md`.
- CI / releasing → `reference/release-process.md` (+ `guides/cutting-a-release.md`).
- Unsure about a documented quirk → `memory/doc-gaps.md`.

The full category catalog and per-doc index live in `index.md`.
