# Init, Runtime Fixes, and v0.2.4 Release

## Task
- Bootstrapped `llmdoc/` from scratch (init) via 3 parallel investigators + recorder.
- Fixed 3 runtime issues in `src/extension.ts`: honor `check.run: manual` on
  open/save (new `lintAuto` gate), add a 30s `execFile` timeout
  (`EXEC_TIMEOUT_MS`) to prevent hang + temp-file leak, and clear debounce
  timers on dispose.
- Cut release v0.2.4 (bump, changelog, commit, tag, push, gated publish;
  verified 0.2.4 on Open VSX).
- Filed Open VSX namespace-claim issue (#11645) and set an hourly cron to track it.

## Expected vs Actual
- Expected: init + runtime fixes + a clean release; investigate the
  "unverified publisher" status on Open VSX.
- Actual: all delivered and the release ran cleanly. But two secondary
  problems surfaced: (1) an early WebFetch of a GitHub issue silently dropped a
  maintainer comment, and (2) two recorded/proposed doc-gaps were wrong or not
  worth acting on.

## What Went Wrong
- **WebFetch missed GitHub issue comments.** First `WebFetch` of Open VSX issue
  #11617 reported "no comments," but maintainer `kineticsquid` had commented
  "Please use the namespace issue form." A real correctness miss the user caught.
- **Recorded a false doc-gap.** Logged a "stale committed VSIX / dist vs
  .gitignore contradiction" gap; `git ls-files` later showed neither is
  tracked — there was no contradiction.
- **Proposed a low-value fix.** Flagged "CI doesn't pin node-version" as a gap
  and pinned it to `20`; user noted Node 20 is already deprecated in GitHub
  Actions, so a hard pin is churn for near-zero benefit.

## Root Cause
- Used a generic HTML fetch (`WebFetch`) against a JS-rendered GitHub page;
  issue/PR comments load dynamically and are absent from the static HTML.
- Recorded gaps speculatively without first verifying against actual tooling
  (`git ls-files`), and recommended a change without weighing its maintenance
  cost.

## Missing Docs or Signals
- No standing rule saying "for GitHub issue/PR state and comments use `gh`, not
  WebFetch."
- No explicit reminder that recorded doc-gaps must be verified with real
  tooling before being written down, and that proposed fixes must clear a
  cost/benefit bar.

## Promotion Candidates
- **Open VSX publisher-verification facts** → `reference/release-process.md`:
  verification is namespace-level and retroactive; publishing is *not* blocked
  by an unclaimed namespace; claim ownership via the
  `claim-namespace-ownership` issue form.
- **"Use `gh`, not WebFetch, for GitHub dynamic content"** →
  `must/working-agreement.md` (or a small guide).
- **No-node-pin decision** → `memory/decisions/` (keep CI on
  `actions/setup-node` defaults rather than pinning a hard version number).

## Follow-up
- Recorder is applying the doc edits above in parallel; confirm the three
  promotions landed.
- Hourly cron is tracking Open VSX issue #11645; close it once the namespace
  claim is verified and the "unverified publisher" badge clears.

## What Went Right (keep doing)
- `guides/cutting-a-release.md` and `reference/release-process.md` matched
  reality: the release executed end-to-end (version gate, gated publish,
  observed Open VSX propagation delay) with no surprises.
