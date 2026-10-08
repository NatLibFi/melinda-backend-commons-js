# @natlibfi/melinda-backend-commons — DEPRECATED

This package is **deprecated**. Its functionality has been split into two packages:

| Functionality | New home |
|---------------|----------|
| Shared utils (env, logging, crypto, webhook, `millisecondsToString`), CLI bins `gen-jwt-token` / `gen-encryption-key`, MARC helpers | [`@natlibfi/melinda-commons`](https://github.com/NatLibFi/melinda-commons-js) (v16+) |
| Mail functionality (`mailer` CLI, templates, `generateMailer`) | [`@natlibfi/melinda-mailer`](https://github.com/NatLibFi/melinda-mailer-js) |

## Migrating

1. Replace `@natlibfi/melinda-backend-commons` with `@natlibfi/melinda-commons` in `package.json` (use `^16`).
2. Function names and signatures are unchanged for the shared utils, **except the encryption format**: `encryptString`/`decryptString` moved from AES-256-CTR to AES-256-GCM (authenticated). `decryptString` in v16 reads **only** GCM values — values written by `@natlibfi/melinda-backend-commons` ≤ 3.0.6 cannot be read by v16 and must be **re-encrypted with the same key before upgrading** (one-off script: read with the old CTR decoder, write back with v16 `encryptString`). Code changes are otherwise limited to the import specifier.
3. If you used the mailer CLI or mail functions, switch those imports to `@natlibfi/melinda-mailer`.

> **Note:** Both `@natlibfi/melinda-commons` and `@natlibfi/melinda-mailer` are **TypeScript** (with shipped type declarations) and require **Node.js v24+**.

No new versions of this package will be published.

## License and copyright

Copyright (c) 2018-2026 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT** or any later version.
