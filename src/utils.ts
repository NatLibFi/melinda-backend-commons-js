import morgan from 'morgan';
import winston from 'winston';
import moment from 'moment';
import {promisify} from 'util';

import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';
import createDebugLogger from 'debug';
import {millisecondsToString} from './millisecondsToString.js';

import {generateBasicNotification, generateBlobNotification} from './notificationTemplates.js';

const setTimeoutPromise = promisify(setTimeout);

interface readEnvironmentVariableOptions {
  defaultValue?: string | boolean | number | any[]
  hideDefault?: boolean | number,
  format?: (arg: any) => any
}

export function readEnvironmentVariable(name: string, {defaultValue = undefined, hideDefault = false, format = v => v}: readEnvironmentVariableOptions = {}) {
  if (process.env[name] === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Mandatory environment variable missing: ${name}`);
    }

    if (typeof defaultValue === 'boolean') {
      return Boolean(defaultValue);
    }

    const defaultValuePrintable = typeof defaultValue === 'object' ? JSON.stringify(defaultValue) : defaultValue;

    console.error(`No environment variable set for ${name}, using default value: ${hideDefault ? '[hidden]' : defaultValuePrintable}`); // eslint-disable-line no-console
    return defaultValue;
  }

  return format(process.env[name]);
}

export function createLogger(options = {}) {
  return winston.createLogger({...createLoggerOptions(), ...options});
}

function createLoggerOptions() {
  const logLevel = process.env['LOG_LEVEL'] || 'info';
  const debuggingEnabled = logLevel === 'debug';
  const timestamp = winston.format(info => ({...info, timestamp: moment().format()}));

  return {
    // @ts-expect-error format message is wrong type but works
    format: winston.format.combine(timestamp(), winston.format.printf(formatMessage)),
    transports: [
      new winston.transports.Console({
        level: logLevel,
        silent: process.env['NODE_ENV'] === 'test' && !debuggingEnabled
      })
    ]
  };

  function formatMessage({timestamp, level, message}): string {
    return `${timestamp} - ${level}: ${message}`;
  }
}

interface expressLoggerOptions {
  dateFormat: string,
  responseTimeDigits: number
}

export function createExpressLogger({dateFormat = 'iso', responseTimeDigits = 3}: expressLoggerOptions) {
  return morgan(`:date[${dateFormat}] :remote-addr HTTP :method :url - :status :response-time[${responseTimeDigits}] ms - :user-agent`);
}

export function handleInterrupt(arg) {
  if (arg instanceof Error) {
    console.error(`Uncaught Exception: ${arg.stack}`); // eslint-disable-line no-console
    process.exit(1);
  }

  console.log(`Received ${arg}`); // eslint-disable-line no-console
  process.exit(1);
}

type mockBytes = Buffer | false

export function generateEncryptionKey(mockBytes: mockBytes = false) {
  return !mockBytes ? randomBytes(32).toString('hex') : mockBytes.toString('hex');
}

export function encryptString({key, value}, mockBytes: mockBytes = false) {
  const iv = !mockBytes ? randomBytes(16) : mockBytes;
  const Cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Cipher.update(value, 'utf8');
  return Buffer.concat([iv, encrypted, Cipher.final()]).toString('base64');
}

export function decryptString({key, value}) {
  const input = Buffer.from(value, 'base64');
  const Decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), input.subarray(0, 16));
  return Decipher.update(input.subarray(16).toString(), 'utf8', 'utf8') + Decipher.final('utf8');
}

export function logWait(logger, waitTime) {
  //const debug = createDebugLogger('@natlibfi/melinda-backend-commons:utils:logWait');
  //const debugData = debug.extend('data');

  // 900000 ms = 15 min
  if (waitTime % 900000 === 0) {
    return logger.verbose(`Total wait: ${millisecondsToString(waitTime)}`);
  }
  // 60000ms = 1min
  if (waitTime % 60000 === 0) {
    return logger.debug(`Total wait: ${millisecondsToString(waitTime)}`);
  }
  return logger.silly(`Total wait: ${millisecondsToString(waitTime)}`);
}

export function joinObjects(obj, objectToBeJoined, arrayOfKeysWanted: string[] = []) {
  // Add the new items to the object if they are not undefined
  if (arrayOfKeysWanted.length > 0) {
    arrayOfKeysWanted.forEach(wantedKey => {
      if (objectToBeJoined[wantedKey] !== undefined) {
        obj[wantedKey] = objectToBeJoined[wantedKey];
        return;
      }
    });

    return;
  }

  Object.keys(objectToBeJoined).forEach(key => {
    if (objectToBeJoined[key] !== undefined) {
      obj[key] = objectToBeJoined[key];
      return;
    }

    return;
  });
}

type webhookUrl = string | false;

interface basicNotificationContext {
  text: string
}

interface blobNotificationContext {
  profile?: string,
  id?: string,
  correlationId?: string,
  numberOfRecords?: number,
  failedRecords?: number,
  processedRecords?: number,
  created?: number,
  updated?: number,
  skipped?: number,
  error?: number,
}

// Same as in notification templates
interface sendNotificationOpts {
  environment?: false | string,
  linkUrl?: string,
  template: string | false,
  fail?: boolean
}

interface createWebhookOperatorResponse {
  sendNotification: (bodyData: basicNotificationContext | blobNotificationContext, options: sendNotificationOpts) => Promise<boolean>
}

export function createWebhookOperator(WEBHOOK_URL: webhookUrl = false): createWebhookOperatorResponse {
  if (WEBHOOK_URL === false) {
    throw new Error('WEBHOOK_URL missing');
  }

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

  async function sendNotification(bodyData: basicNotificationContext | blobNotificationContext, options: sendNotificationOpts = {template: 'basic'}): Promise<boolean> {
    const method = 'POST';
    const headers = {type: 'application/json'};

    try {
      const body = prepareBodyData(bodyData, options);
      const response = await fetch(URL, {method, headers, body});
      if (response.ok) {
        return true;
      }

      throw new Error(`HTTP response status was not ok (${response.status})`);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      debug(`Encountered problem when sending notification: ${error.message}`);
      // throw new Error('Sending notification webhook failed');
      return false;
    }
  }

  async function sendNotificationMock(bodyData: basicNotificationContext | blobNotificationContext, options: sendNotificationOpts = {template: false, fail: false}): Promise<boolean> {
    debug('Mock notification!');
    debug(JSON.stringify(bodyData));
    debug(JSON.stringify(options));
    await setTimeoutPromise(10);

    if (options.fail) {
      debug('Notification send HTTP response status was not ok (MOCK)');
      return false;
    }

    return true;
  }

  function prepareBodyData(bodyData, options) {
    if (options.template === 'basic') {
      const objectAsBody = generateBasicNotification(bodyData, options);
      return JSON.stringify(objectAsBody);
    }

    if (options.template === 'blob') {
      const objectAsBody = generateBlobNotification(bodyData, options);
      return JSON.stringify(objectAsBody);
    }

    return JSON.stringify(bodyData);
  }
}
