import {sendEmail} from './mailer';
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
    .usage('$0 <JSON file> [options] (env variable info in README)')
    .showHelpOnFail(true)
    .example([['$ node $0/dist/cli.js file.json --from example@mail.com --to example2@mail.com --sub "Example subject" --temp "exampleTemplate"']])
    .version()
    .env('MELINDA_MAILER')
    .positional('JSON file', {type: 'string', describe: 'JSON file for template context'})
    .options({
      from: {type: 'string', default: false, alias: 'emailFrom', describe: 'Email from'},
      to: {type: 'string', default: false, alias: 'emailTo', describe: 'Email to'},
      sub: {type: 'string', default: false, alias: 'subject', describe: 'Email subject'},
      temp: {type: 'string', default: false, alias: 'template', describe: 'Email template'},
      dev: {type: 'boolean', default: false, alias: 'development', describe: 'Development mode'}
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
    .parse();

  // console.log(JSON.stringify(args));
  logger.info(`Reading context file ${args._[0]}`);
  const context = JSON.parse(fs.readFileSync(args._[0], {encoding: 'UTF-8'}));
  logger.info('Reading smtp config from env');
  const smtpConfig = JSON.parse(args.smtpConfig);
  const messageOptions = {
    from: args.from,
    to: args.to,
    subject: args.sub,
    templateName: args.temp,
    test: args.dev,
    context
  };
  logger.debug(JSON.stringify(messageOptions));
  logger.debug(JSON.stringify(smtpConfig));
  if (messageOptions.test) {
    const {html, text} = await sendEmail({smtpConfig, messageOptions});
    logger.info('Test run!');
    logger.info('***---***');
    logger.info(`HTML string:\n${html}`);
    logger.info('***---***');
    logger.info(`Text string:\n${text}`);
    logger.info('***---***');

    return;
  }

  await sendEmail({smtpConfig, messageOptions});
}
