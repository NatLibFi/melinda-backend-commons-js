import {sendEmail} from "./mailer";
import fs from 'fs';
import yargs from 'yargs';
import {createLogger, handleInterrupt} from './utils.js';
run();

async function run() {
  const logger = createLogger();

  process
    .on('SIGINT', handleInterrupt)
    .on('unhandledRejection', handleInterrupt)
    .on('uncaughtException', handleInterrupt);

  const args = yargs(process.argv.slice(2))
    .scriptName('melinda-mailer-cli')
    .wrap(yargs.terminalWidth())
    .epilog('Copyright (C) 2024 University Of Helsinki (The National Library Of Finland)')
    .usage('$0 <JSON file> [options] and env variable info in README')
    .showHelpOnFail(true)
    .example([
      ['$ node $0/dist/cli.js file.json -e example@mail.com -s "Example subject" -t exampleTemplate'],
    ])
    .env('MELINDA_MAILER')
    .positional('file', {type: 'string', describe: 'File for template context'})
    .options({
      f: {type: 'string', default: false, alias: 'emailFrom', describe: 'Email from'},
      e: {type: 'string', default: false, alias: 'emailTo', describe: 'Email to'},
      s: {type: 'string', default: false, alias: 'subject', describe: 'Email subject'},
      t: {type: 'string', default: false, alias: 'template', describe: 'Email template'},
    })
    .check((args) => {
      const [file] = args._;
      if (file === undefined) {
        throw new Error('No file argument given');
      }

      if (!fs.existsSync(file)) {
        throw new Error(`File ${file} does not exist`);
      }

      return true;
    })
    .parseSync();

  // console.log(JSON.stringify(args));
  logger.info(`Reading context file ${args._[0]}`);
  const context = JSON.parse(fs.readFileSync(args._[0], {encoding: 'UTF-8'}));
  logger.info('Reading smtp config from env');
  const smtpConfig = JSON.parse(args.smtpConfig);
  const messageOptions = {
    from: args.f,
    to: args.e,
    subject: args.s,
    templateName: args.t,
    context: context
  };
  logger.info(JSON.stringify(messageOptions));
  logger.info(JSON.stringify(smtpConfig));
  await sendEmail({smtpConfig, messageOptions});
}