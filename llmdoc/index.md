# llmdoc Index — expl3-vscode

Global map of the documentation system. The startup reading order lives in
`startup.md` (not duplicated here). For a fast "where do I look for X", see
`must/doc-routing.md`.

## Categories

- **`must/`** — tiny, stable docs to read on every run.
- **`overview/`** — identity, boundaries, and role of the project.
- **`architecture/`** — flows, ownership boundaries, and invariants.
- **`guides/`** — one workflow per document.
- **`reference/`** — stable lookup facts (settings, scopes, release model).
- **`memory/`** — process memory: `decisions/` and `doc-gaps.md` (owned by
  `recorder`), `reflections/` (owned by `reflector`).

## Documents

### must/
- `must/project-basics.md` — what the extension is, key dirs, two-feature split, esbuild build.
- `must/working-agreement.md` — language conventions, align-before-edits, post-change checklist.
- `must/doc-routing.md` — quick "where do I look for X" routing table.

### overview/
- `overview/project-overview.md` — identity, major areas, and what does / does not belong.

### architecture/
- `architecture/diagnostics-runtime.md` — the full explcheck flow in `src/extension.ts`: activation, triggers/debounce, dirty-buffer temp files, spawn/args, parsing, severity mapping, clickable codes, and the invariants/edge cases.
- `architecture/grammar-injection.md` — the injection model, `injectionSelector` vs `injectTo`, the `source.expl3` base grammar, token patterns, match-order invariant, and the v0.2.2 docstrip fix.

### reference/
- `reference/configuration.md` — the `expl3.check.*` settings table + arg mapping, the `expl3.check.run` command, supported file types.
- `reference/scopes.md` — token category → TextMate scope catalog for theme/grammar authors.
- `reference/release-process.md` — the tag-driven CI + gated release/publish model, including Open VSX publisher verification.

### guides/
- `guides/adding-grammar-tokens.md` — add/adjust a highlighted token, respect match order, add tests, run `npm test`.
- `guides/cutting-a-release.md` — maintainer release checklist (bump, changelog, tag, approve gate).

### memory/
- `memory/doc-gaps.md` — open questions / unverified behavior (recorder-owned).
- `memory/decisions/` — recorded design decisions (recorder-owned):
  - `memory/decisions/no-ci-node-pin.md` — why CI leaves `node-version` unpinned.
  - `memory/decisions/open-vsx-namespace-claim.md` — claiming the `CTeX-org` Open VSX namespace (issue #11645).
- `memory/reflections/` — process lessons (reflector-owned).

## Routing rules

- Startup context and post-change duties → `must/`.
- "What is this / what's out of scope" → `overview/`.
- "How does behavior X actually work / what are the invariants" → `architecture/`.
- "What is the exact value / name / contract" → `reference/`.
- "How do I perform task X" → `guides/`.
- "Is this behavior intended / historical why" → `memory/`.
