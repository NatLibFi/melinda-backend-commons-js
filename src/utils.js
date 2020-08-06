/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Shared modules for Melinda's backend applications
*
* Copyright (C) 2018-2020 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-backend-commons-js
*
* melinda-backend-commons-js program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-backend-commons-js is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import expressWinston from 'express-winston';
import winston from 'winston';
import moment from 'moment';

export function readEnvironmentVariable(name, {defaultValue = undefined, hideDefault = false, format = v => v} = {}) {
  if (process.env[name] === undefined) { // eslint-disable-line no-process-env
    if (defaultValue === undefined) { // eslint-disable-line functional/no-conditional-statement
      throw new Error(`Mandatory environment variable missing: ${name}`);
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
	if (arg instanceof Error) {
		console.error(`Uncaught Exception: ${arg.stack}`);
		// Signal
	} else {
		console.log(`Received ${arg}`);
	}

	process.exit(1);
}