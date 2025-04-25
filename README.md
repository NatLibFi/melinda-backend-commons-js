# Shared modules for Melinda's backend applications [![NPM Version](https://img.shields.io/npm/v/@natlibfi/melinda-backend-commons.svg)](https://npmjs.org/package/@natlibfi/melinda-backend-commons)

## Mailer cli
### Envs:
* Required
  * MELINDA_MAILER_SMTP_CONFIG: contains stringified smtp config
    * e.g. '{"host":"smtp.url.com","port":587,"secure": false,"auth":{"user":"","pass":""}}'
* Optional
  * MELINDA_MAILER_EMAIL_FROM: Email from
  * MELINDA_MAILER_EMAIL_TO: Email to
  * MELINDA_MAILER_SUBJECT: Email subject
  * MELINDA_MAILER_TEMPLATE: Email template name
  * MELINDA_MAILER_TEMPLATE_TEST: true/false

## License and copyright

Copyright (c) 2018-2025 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT** or any later version.
