# Reference — CI & Release Process

Two GitHub Actions workflows: `ci.yml` (validation on push/PR) and `release.yml`
(tag-driven build + gated publish).

## CI — `.github/workflows/ci.yml`

- **Triggers**: `push` and `pull_request` on `main`.
- Single job `validate` on `ubuntu-latest`. Steps:
  1. `actions/checkout@v7`.
  2. `actions/setup-node@v6` — **no `node-version` pinned** (uses action default;
     see `memory/doc-gaps.md`).
  3. Validate grammar JSON: `node -e` `JSON.parse` of
     `syntaxes/expl3.tmLanguage.json`.
  4. `npm ci`.
  5. Type-check: `npx tsc --noEmit`.
  6. Compile: `npm run compile` (esbuild → `dist/extension.js`).
  7. Grammar regression test: `npm test` (`tests/grammar.test.mjs`).
  8. Package dry run: `npx vsce package --no-yarn -o /tmp/expl3-vscode-ci.vsix`.
- The render tools (`tests/render-*.mjs`) are **not** run in CI — they need the
  `$LW` env var (LaTeX Workshop grammars) and, for diagnostics, a working
  `explcheck`.

## Release — `.github/workflows/release.yml`

Model mirrors the ctex-kit philosophy; "only the reviewer can publish" is
enforced by the `release` GitHub Environment.

- **Trigger**: `push` on tags matching `v*`. `permissions: contents: write`.

### Job `build` (`ubuntu-latest`)

- **Parse tag**: `VER=${TAG#v}`; `BASE` strips a trailing
  `-(rc|pre|alpha|beta)[0-9]*` suffix. If `VER != BASE` → `prerelease=true`.
  So `vX.Y.Z-rcM` (also `-pre`/`-alpha`/`-beta`) is a **prerelease**; `vX.Y.Z`
  is a **full release**.
- **Version gate**: reads `package.json` version; if it differs from the tag
  `base`, emits `::error:: Bump package.json before tagging.` and `exit 1`.
  The bump must precede the tag.
- `npm ci`, `npx tsc --noEmit`.
- **Package VSIX**: `npx vsce package --no-yarn -o expl3-vscode-<version>.vsix`
  (this triggers `vscode:prepublish` → minified compile).
- Upload the VSIX as an artifact (`vsix`, 30-day retention).
- **Create GitHub release** via `gh release create $GITHUB_REF_NAME`:
  - prerelease → `--prerelease --title "expl3-vscode <ver> (prerelease)"`.
  - full → `--latest --title "expl3-vscode <ver>"`.
  - always `--generate-notes` and attaches the VSIX (falls back to
    `gh release upload --clobber`).

### Job `publish`

- `needs: build`; guard `if: needs.build.outputs.prerelease == 'false'` — runs
  **only for full tags**. Prereleases never reach a marketplace.
- `environment: release` — the gate. This environment has a **Required
  reviewer**, so the job pauses for manual approval. `VSCE_PAT` and `OVSX_PAT`
  are **environment secrets** on `release`, readable only by the approved job.
- Steps: `setup-node@v6`; download the `vsix` artifact; `npm install --no-save
  @vscode/vsce ovsx`.
  - Publish to VS Code Marketplace: fail fast if `VSCE_PAT` unset, then
    `npx vsce publish --no-yarn --packagePath <vsix> -p $VSCE_PAT`.
  - Publish to Open VSX: fail fast if `OVSX_PAT` unset,
    `npx ovsx create-namespace CTeX-org -p $OVSX_PAT || true`, then
    `npx ovsx publish <vsix> -p $OVSX_PAT`.

### One-time environment setup

Create a GitHub Environment named `release`, add the maintainer as Required
reviewer, and add `VSCE_PAT` + `OVSX_PAT` as environment secrets.

## Publisher verification (Open VSX)

- The extension is published to Open VSX as an **unverified publisher** until
  the `CTeX-org` namespace is claimed.
- Verification is **namespace-level and retroactive**: once the namespace is
  claimed, existing published versions become verified automatically.
- Publishing new versions is **not blocked** by an unclaimed namespace, so the
  release flow above works regardless.
- Claim namespace ownership via the Open VSX `claim-namespace-ownership` issue
  form. See `memory/decisions/open-vsx-namespace-claim.md` for the current claim
  and its status.

## Prerelease vs release summary

| Tag | GitHub release | Marketplace / Open VSX |
|---|---|---|
| `vX.Y.Z-rcM` (`-pre`/`-alpha`/`-beta`) | prerelease | never |
| `vX.Y.Z` | latest release | yes, after reviewer approval |

## Maintainer procedure

See `guides/cutting-a-release.md` for the step-by-step.
