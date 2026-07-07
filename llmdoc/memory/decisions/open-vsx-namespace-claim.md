# Decision — Claim the Open VSX `CTeX-org` namespace

## Decision

Claim ownership of the Open VSX `CTeX-org` namespace so the extension is
published as a **verified** publisher, instead of remaining unverified.

## Context

The extension publishes to Open VSX under the `CTeX-org` namespace (see
`reference/release-process.md`). Until the namespace is claimed, Open VSX marks
it as an **unverified publisher**. Publishing new versions is not blocked by an
unclaimed namespace, but the unverified badge is undesirable.

## Approach

Claim filed via the official Open VSX `claim-namespace-ownership` issue form:

- Issue: [EclipseFdn/open-vsx.org#11645](https://github.com/EclipseFdn/open-vsx.org/issues/11645)
- Option chosen: **Option 1 — "VS Code Publisher with Repo"** (public repo owned
  by the `CTeX-org` org).
- Eligibility: requester @Liam0205 is a public member of the `CTeX-org` org and
  the account is more than 12 months old.

A prior free-form issue (#11617) was redirected here by the maintainer; #11645
is the canonical claim.

## Status

**Pending admin approval.** An hourly tracker is watching the issue. Once the
namespace is claimed, verification is namespace-level and retroactive — existing
published versions become verified automatically.
