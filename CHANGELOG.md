# Changelog

## 5.0.0-alpha.3

- Promote `@natlibfi/fixugen` (4.0.0) and `@natlibfi/fixura` (5.0.0) devDeps from alpha to stable. No runtime changes.

## 5.0.0-alpha.2

- No functional changes. Packaging/CI only: expanded `.npmignore` (workspace docs & repo tooling no longer shipped in the tarball) and CI now tests Node 24 + 26 with `actions/checkout`/`actions/setup-node` v7.

## 5.0.0-alpha.1

### Breaking changes

- **Removed mail functionality** from this package:
  - `sendEmail` export removed — use [`@natlibfi/melinda-commons-mailer`](https://github.com/NatLibFi/melinda-commons-mailer-js) instead (same function signature).
  - `mailer` bin removed — the `@natlibfi/melinda-commons-mailer` package provides the same CLI.
  - Dependencies `nodemailer`, `html-to-text`, and `yargs` removed.

Migration: switch the `sendEmail` import from `@natlibfi/melinda-backend-commons` to `@natlibfi/melinda-commons-mailer` and add the new dependency. Backends not using mail need only a routine version bump.
