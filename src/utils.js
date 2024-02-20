import expressWinston from 'express-winston';
import winston from 'winston';
import moment from 'moment';
import {createCipheriv, createDecipheriv, randomBytes} from 'crypto';
import prettyPrint from 'pretty-print-ms';
import createDebugLogger from 'debug';

import {generateBasicNotification, generateBlobNotification} from './notificationTemplates';

export function readEnvironmentVariable(name, {defaultValue = undefined, hideDefault = false, format = v => v} = {}) {
  if (process.env[name] === undefined) { // eslint-disable-line no-process-env
    if (defaultValue === undefined) { // eslint-disable-line functional/no-conditional-statements
      throw new Error(`Mandatory environment variable missing: ${name}`);
    }

    if (typeof defaultValue === 'boolean') {
      return Boolean(defaultValue);
    }

    const defaultValuePrintable = typeof defaultValue === 'object' ? JSON.stringify(defaultValue) : defaultValue;

    console.error(`No environment variable set for ${name}, using default value: ${hideDefault ? '[hidden]' : defaultValuePrintable}`); // eslint-disable-line no-console
    return defaultValue;
  }

  return format(process.env[name]); // eslint-disable-line no-process-env
}

export function createLogger(options = {}) {
  return winston.createLogger({...createLoggerOptions(), ...options});
}

export function createExpressLogger(options = {}) {
  return expressWinston.logger({
    meta: true,
    msg: '{{req.ip}} HTTP {{req.method}} {{req.path}} - {{res.statusCode}} {{res.responseTime}}ms',
    ignoreRoute: () => false,
    ...createLoggerOptions(),
    ...options
  });
}

function createLoggerOptions() {
  const logLevel = process.env.LOG_LEVEL || 'info'; // eslint-disable-line no-process-env
  const debuggingEnabled = logLevel === 'debug';
  const timestamp = winston.format(info => ({...info, timestamp: moment().format()}));

  return {
    format: winston.format.combine(timestamp(), winston.format.printf(formatMessage)),
    transports: [
      new winston.transports.Console({
        level: logLevel,
        silent: process.env.NODE_ENV === 'test' && !debuggingEnabled // eslint-disable-line no-process-env
      })
    ]
  };

  function formatMessage({timestamp, level, message}) {
    return `${timestamp} - ${level}: ${message}`;
  }
}

export function handleInterrupt(arg) {
  if (arg instanceof Error) { // eslint-disable-line functional/no-conditional-statements
    console.error(`Uncaught Exception: ${arg.stack}`); // eslint-disable-line no-console
    process.exit(1); // eslint-disable-line no-process-exit
  }

  console.log(`Received ${arg}`); // eslint-disable-line no-console
  process.exit(1); // eslint-disable-line no-process-exit
}

export function generateEncryptionKey() {
  return randomBytes(32).toString('hex');
}

export function encryptString({key, value}) {
  const iv = randomBytes(16);
  const Cipher = createCipheriv('aes-256-ctr', Buffer.from(key, 'hex'), iv);
  const encrypted = Cipher.update(value, 'utf8');
  return Buffer.concat([iv, encrypted, Cipher.final()]).toString('base64');
}

export function decryptString({key, value}) {
  const input = Buffer.from(value, 'base64');
  const Decipher = createDecipheriv('aes-256-ctr', Buffer.from(key, 'hex'), input.slice(0, 16));
  return Decipher.update(input.slice(16), 'utf8', 'utf8') + Decipher.final('utf8');
}

export function logWait(logger, waitTime) {
  // 900000 ms = 15 min
  if (waitTime % 900000 === 0) {
    return logger.verbose(`Total wait: ${prettyPrint(waitTime)}`);
  }
  // 60000ms = 1min
  if (waitTime % 60000 === 0) {
    return logger.debug(`Total wait: ${prettyPrint(waitTime)}`);
  }
  return logger.silly(`Total wait: ${prettyPrint(waitTime)}`);
}

export function joinObjects(obj, objectToBeJoined, arrayOfKeysWanted = []) {
  // Add the new items to the object if they are not undefined
  if (arrayOfKeysWanted.length > 0) {
    arrayOfKeysWanted.forEach(wantedKey => {
      if (objectToBeJoined[wantedKey] !== undefined) {
        obj[wantedKey] = objectToBeJoined[wantedKey]; // eslint-disable-line functional/immutable-data
        return;
      }
    });

    return;
  }

  Object.keys(objectToBeJoined).forEach(key => {
    if (objectToBeJoined[key] !== undefined) {
      obj[key] = objectToBeJoined[key]; // eslint-disable-line functional/immutable-data
      return;
    }

    return;
  });
}

/**
 * Creates webhook operator interface which allows using sendNotification function to send messages using HTTP
 * requests. Requests are POST requests and given text is placed into 'text' attribute in request body.
 * @param {string} WEBHOOK_URL Webhook URL. Remember to define this as secret that is read from env variable.
 * @returns {Object} Object containing sendNotification function
 */
export function createWebhookOperator(WEBHOOK_URL = false) {
  const debug = createDebugLogger('@natlibfi/melinda-backend-commons:sendNotification');
  const URL = WEBHOOK_URL;

  if (typeof URL !== 'string') {
    throw new Error('Webhook URL is not defined');
  }

  if (WEBHOOK_URL === 'test') {
    return {sendNotification: sendNotificationMock};
  }

  if (!URL.startsWith('https')) {
    throw new Error('Webhook URL needs to use https');
  }

  return {sendNotification};

  /**
   * Sends notification as POST requests and given text is placed into 'text' attribute in request body.
   * @param {Object} bodyData as default must contain {text: '<message>'} on template use it contains template custom data
   * @param {?Object} options as default {template: false} on template use it contains template name and other options
   * @returns {boolean} was notification send ok
   */
  async function sendNotification(bodyData, options = {template: 'basic'}) {
    const method = 'POST';
    const headers = {type: 'application/json'};

    try {
      const body = prepareBodyData(bodyData, options);
      const response = await fetch(URL, {method, headers, body});
      if (response.ok) {
        return true;
      }

      throw new Error(`HTTP response status was not ok (${response.status})`);
    } catch (err) {
      debug(`Encountered problem when sending notification: ${err.message}`);
      throw new Error('Sending notification webhook failed');
    }
  }

  function sendNotificationMock(bodyData, options = {template: false, fail: false}) {
    debug('Mock notification!');
    debug(JSON.stringify(bodyData));
    debug(JSON.stringify(options));

    if (options.fail) {
      throw new Error('HTTP response status was not ok (MOCK)');
    }

    return true;
  }

  function prepareBodyData(bodyData, options) {
    const creatorFunctions = [
      {template: 'blob', func: generateBlobNotification},
      {template: 'basic', func: generateBasicNotification}
    ];
    const {func: createFunction} = creatorFunctions.find(({template}) => options.template === template);
    const objectAsBody = createFunction ? createFunction(bodyData, options) : bodyData;
    return JSON.stringify(objectAsBody);
  }
}
