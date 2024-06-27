import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import {createLogger} from './utils.js';
import path from 'path';

export async function sendEmail({messageOptions = false, smtpConfig = false}) {
  if (!messageOptions || !smtpConfig) {
    throw new Error('Mailer is missing parametters');
  }
  const logger = createLogger();
  const {from, to, subject, templateName, context} = messageOptions;

  // Establish email connection
  const transporter = nodemailer.createTransport(smtpConfig);

  const viewPath = path.resolve(__dirname, './mailerTemplates/views');
  const partialsPath = path.resolve(__dirname, './mailerTemplates/partials');
  logger.debug(viewPath);
  logger.debug(partialsPath);

  transporter.use('compile', hbs({
    viewEngine: {
      //extension name
      extName: '.handlebars',
      // layout path declare
      layoutsDir: viewPath,
      defaultLayout: false,
      //partials directory path
      partialsDir: partialsPath
    },
    //View path declare
    partialsDir: partialsPath,
    viewPath,
    extName: '.handlebars'
  }));

  // Verify server is ready to accept messages
  await transporter.verify();

  const nodemailerMessage = {
    from,
    to,
    subject,
    template: templateName,
    text_template: `${templateName}-text`, // eslint-disable-line camelcase
    context
  };

  // Send message, main try/catch should catch errors occurring here
  await transporter.sendMail(nodemailerMessage);
}

