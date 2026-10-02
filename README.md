# Shared modules for Melinda's backend applications [![NPM Version](https://img.shields.io/npm/v/@natlibfi/melinda-backend-commons.svg)](https://npmjs.org/package/@natlibfi/melinda-backend-commons)

## Mail functionality

Mail functionality (`sendEmail` and the `mailer` CLI) has moved to [`@natlibfi/melinda-commons-mailer`](https://github.com/NatLibFi/melinda-commons-mailer-js) — import `sendEmail` from there. The move isolates `nodemailer` dependency churn from this package.

Migration: change the import from `@natlibfi/melinda-backend-commons` to `@natlibfi/melinda-commons-mailer` (same function signature) and add the new dependency.

## License and copyright

Copyright (c) 2018-2026 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT** or any later version.
