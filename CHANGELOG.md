# Changelog

## 5.0.0-alpha.1

### Breaking changes

- **Removed mail functionality** from this package:
  - `sendEmail` export removed — use [`@natlibfi/melinda-commons-mailer`](https://github.com/NatLibFi/melinda-commons-mailer-js) instead (same function signature).
  - `mailer` bin removed — the `@natlibfi/melinda-commons-mailer` package provides the same CLI.
  - Dependencies `nodemailer`, `html-to-text`, and `yargs` removed.

Migration: switch the `sendEmail` import from `@natlibfi/melinda-backend-commons` to `@natlibfi/melinda-commons-mailer` and add the new dependency. Backends not using mail need only a routine version bump.
