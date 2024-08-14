import {convert} from 'html-to-text';
import nodemailer from 'nodemailer';
import path from 'path';
import {readFileSync} from 'node:fs';

import {createLogger} from './utils.js';

export async function sendEmail({messageOptions = false, smtpConfig = false}) {
  if (!messageOptions || !smtpConfig) {
    throw new Error('Mailer is missing parametters');
  }
  const logger = createLogger();
  const {from, to, subject, templateName, context, test = false} = messageOptions;

  // Prepare mail content
  logger.debug('Preparing mail content');
  const html = await templateHandling(templateName, context);
  const text = convert(html);
  // console.log(text); // eslint-disable-line

  if (test) {
    logger.debug('This is test, returning html and text mail content');
    return {html, text};
  }

  // Establish email connection
  logger.debug('Preparing email connection');
  const transporter = nodemailer.createTransport(smtpConfig);

  // Verify server is ready to accept messages
  await transporter.verify();

  const nodemailerMessage = {
    from,
    to,
    subject,
    html,
    text
  };

  // Send message, main try/catch should catch errors occurring here
  await transporter.sendMail(nodemailerMessage);
  logger.info('Email sent');
}


async function templateHandling(templateName, context) {
  // Load templates
  const template = readFileSync(path.resolve(__dirname, 'templates', `${templateName}.html`), 'utf8');
  const templateFooter = readFileSync(path.resolve(__dirname, 'templates', 'footer.html'), 'utf8');
  // Fill template
  if (templateName === 'poistot') {
    return fillTemplatePoistot();
  }

  function fillTemplatePoistot() {
    const records = context.recordInfo.map(record => `<p>${record.metadata.title} - ${record.metadata.id} - ${record.status}</p>\n`).join('');
    const blobId = context.blobId ? `<p>Liitäthän viestiisi käsittely id:n ${context.blobId}</p>` : '';
    const tempTemplateRecords = template.replace('##RECORDS##', records);
    const tempTemplateBlobId = tempTemplateRecords.replace('##BLOBID##', blobId);
    const filledTemplate = tempTemplateBlobId.replace('##FOOTER##', templateFooter);

    return filledTemplate;
  }
};
