# Guide — Cutting a Release (Maintainers)

Releases are tag-driven; the mechanics live in `.github/workflows/release.yml`
and are described in `reference/release-process.md`. This is the operator
checklist.

## Prerequisites (one-time)

- A GitHub Environment named `release` exists with the maintainer as **Required
  reviewer** and `VSCE_PAT` + `OVSX_PAT` set as environment secrets.

## Steps

1. **Bump `version` in `package.json`** to the target `X.Y.Z`. The workflow's
   version gate refuses to run if the tag base does not match this value.
2. **Update `CHANGELOG.md`** — add a `## [X.Y.Z] - <date>` section describing the
   changes (Added / Fixed / Changed).
3. **Commit** the bump + changelog (English commit message).
4. **Tag and push**:
   - Full release: `git tag vX.Y.Z && git push origin vX.Y.Z`.
   - Public beta / prerelease: `git tag vX.Y.Z-rcM && git push origin vX.Y.Z-rcM`
     (also `-pre`/`-alpha`/`-beta`).
5. The `build` job runs (version gate → package VSIX → create GitHub release).
6. **For a full `vX.Y.Z` tag only**: open the workflow run and **approve** the
   `release` environment gate so the `publish` job runs and pushes to the VS Code
   Marketplace and Open VSX. Prerelease tags stop at the GitHub release — they
   never reach a marketplace.

## Reminders

- Bump must precede the tag (version gate).
- `vscode:prepublish` minifies the bundle automatically during packaging; do not
  hand-edit `dist/`.
- See `memory/doc-gaps.md` about stale committed VSIX / `dist/` vs `.gitignore`
  before assuming what is in the repo matches HEAD.
