# ADR-011: Tooling follows the JavaScript ecosystem

Every workflow is a script in `package.json`, run with pnpm, and CI runs the same scripts a developer does. Node and pnpm are each pinned in one place. Commit subjects are Conventional Commits, checked by commitlint from a lefthook hook. Work integrates on `main`, merging to it deploys the site, and there are no releases.

A version stated in two places can disagree, which shows up as a check that passes locally and fails in CI. A site deployed from `main` has no versioned artefact to cut a release for.

## Not chosen

- **Taskfile**: It fits the Go ecosystem of the maintainer's other repositories, and here package scripts already do its job.
- **A `next` integration branch and release automation**: They exist for versioned artefacts, and this site has none.
