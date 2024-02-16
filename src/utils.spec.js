import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import nock from 'nock'; // As of 2024-02-15 requires beta for Node experimental native fetch to work
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {
  readEnvironmentVariable,
  generateEncryptionKey, encryptString, decryptString,
  __RewireAPI__ as RewireAPI,
  joinObjects,
  createWebhookOperator
} from './utils';

const FIXTURES_PATH = path.join(__dirname, '../test-fixtures/utils');

describe('utils', () => {
  describe('readEnvironmentVariable', () => {
    afterEach(() => {
      delete process.env.FOO; // eslint-disable-line functional/immutable-data, no-process-env
    });

    it('Should read a environment variable', () => {
      process.env.FOO = 'bar';// eslint-disable-line functional/immutable-data, no-process-env
      expect(readEnvironmentVariable('FOO')).to.equal('bar');
    });

    it('Should use  a default value for environment variable', () => {
      expect(readEnvironmentVariable('FOO', {defaultValue: 'fubar'})).to.equal('fubar');
    });

    it('Should use a boolean default value for environment variable', () => {
      expect(readEnvironmentVariable('FOO', {defaultValue: false})).to.equal(false);
    });

    it('Should not log the default value for environment variable', () => {
      expect(readEnvironmentVariable('FOO', {defaultValue: 'fubar', hideDefault: true})).to.equal('fubar');
    });

    it('Should throw because mandatory variable is missing', () => {
      expect(() => {
        readEnvironmentVariable('FOO');
      }).to.throw(Error, /^Mandatory environment variable missing: FOO$/u);
    });

    it('Should format the variable', () => {
      process.env.FOO = '1'; // eslint-disable-line functional/immutable-data, no-process-env
      expect(readEnvironmentVariable('FOO', {format: v => Number(v)})).to.equal(1);
    });
  });

  describe('generateEncryptionKey', () => {
    afterEach(() => {
      RewireAPI.__ResetDependency__('randomBytes');
    });

    it('Should generate the expected key', () => {
      const bytes = fs.readFileSync(path.join(FIXTURES_PATH, 'generateEncryptionKey/bytes.txt'), 'utf8');
      const expectedKey = fs.readFileSync(path.join(FIXTURES_PATH, 'generateEncryptionKey/expectedKey.txt'), 'utf8');

      RewireAPI.__Rewire__('randomBytes', () => Buffer.from(bytes, 'hex'));

      expect(generateEncryptionKey()).to.equal(expectedKey);
    });
  });

  describe('encryptString', () => {
    afterEach(() => {
      RewireAPI.__ResetDependency__('randomBytes');
    });

    it('Should encrypt the string', () => {
      const bytes = fs.readFileSync(path.join(FIXTURES_PATH, 'encryptString/bytes.txt'), 'utf8');
      const key = fs.readFileSync(path.join(FIXTURES_PATH, 'encryptString/key1.txt'), 'utf8');
      const value = fs.readFileSync(path.join(FIXTURES_PATH, 'encryptString/string1.txt'), 'utf8');
      const expectedValue = fs.readFileSync(path.join(FIXTURES_PATH, 'encryptString/expectedValue1.txt'), 'utf8');

      RewireAPI.__Rewire__('randomBytes', () => Buffer.from(bytes, 'hex'));

      expect(encryptString({key, value})).to.equal(expectedValue);
    });
  });

  describe('descryptString', () => {
    afterEach(() => {
      RewireAPI.__ResetDependency__('randomBytes');
    });

    it('Should decrypt the string', () => {
      const bytes = fs.readFileSync(path.join(FIXTURES_PATH, 'decryptString/bytes.txt'), 'utf8');
      const key = fs.readFileSync(path.join(FIXTURES_PATH, 'decryptString/key1.txt'), 'utf8');
      const value = fs.readFileSync(path.join(FIXTURES_PATH, 'decryptString/string1.txt'), 'utf8');
      const expectedValue = fs.readFileSync(path.join(FIXTURES_PATH, 'decryptString/expectedValue1.txt'), 'utf8');

      RewireAPI.__Rewire__('randomBytes', () => Buffer.from(bytes, 'hex'));

      expect(decryptString({key, value})).to.equal(expectedValue);
    });
  });

  describe('createWebhookOperator', () => {
    const webhookDomain = 'https://foo.bar';
    const webhookPath = '/foo/bar/1234';
    const webhookUrl = `${webhookDomain}${webhookPath}`;

    after(() => {
      nock.cleanAll();
      nock.enableNetConnect(); // Re--enable sending http request to anywhere
    });

    before(() => {
      nock.disableNetConnect(); // Disallow sending http request to anywhere else but pre-defined scopes
    });

    beforeEach(() => {
      nock.cleanAll(); // Make sure previous mocks do not affect the currently starting test
    });

    it('Should return interface with sendNotification function that sends request to webhook URL', async () => {
      const notificationText = {text: 'Foo'};
      // Nock interceptor to mock HTTP request response
      const scope = nock(webhookDomain, {reqheaders: {type: 'application/json'}})
        .post(webhookPath, body => expect(body).to.eql(notificationText))
        .reply(200);

      const webhookOperator = createWebhookOperator(webhookUrl);
      const result = await webhookOperator.sendNotification(notificationText);

      expect(result).to.eq(true);
      expect(scope.isDone()).to.eq(true);
    });

    it('Should send request to webhook URL with blob template and default values', async () => {
      const expectedBody = fs.readFileSync(path.join(FIXTURES_PATH, 'sendNotification/templateBlobDefault.json'), 'utf8');

      // Nock interceptor to mock HTTP request response
      const scope = nock(webhookDomain, {reqheaders: {type: 'application/json'}})
        .post(webhookPath, body => expect(body).to.eql(JSON.parse(expectedBody)))
        .reply(200);

      const webhookOperator = createWebhookOperator(webhookUrl);
      const result = await webhookOperator.sendNotification({}, {template: 'blob'});

      expect(result).to.eq(true);
      expect(scope.isDone()).to.eq(true);
    });

    it('Should send request to webhook URL with blob template custom values', async () => {
      const notificationText = {
        profile: 'foobar',
        id: 'foo',
        correlationId: 'bar',
        numberOfRecords: 12,
        failedRecords: 2,
        processedRecords: 10,
        created: 4,
        updated: 3,
        skipped: 2,
        error: 1
      };
      const templateOptions = {
        template: 'blob',
        environment: 'TEST',
        baseUrl: webhookDomain
      };

      const expectedBody = fs.readFileSync(path.join(FIXTURES_PATH, 'sendNotification/templateBlobCustom.json'), 'utf8');

      // Nock interceptor to mock HTTP request response
      const scope = nock(webhookDomain, {reqheaders: {type: 'application/json'}})
        .post(webhookPath, body => expect(body).to.eql(JSON.parse(expectedBody)))
        .reply(200);

      const webhookOperator = createWebhookOperator(webhookUrl);
      const result = await webhookOperator.sendNotification(notificationText, templateOptions);

      expect(result).to.eq(true);
      expect(scope.isDone()).to.eq(true);
    });

    it('Should throw error when initializing interface without URL', () => {
      expect(() => createWebhookOperator()).to.throw('Webhook URL is not defined');
    });

    it('Should throw error when initializing interface with URL that uses http', () => {
      expect(() => createWebhookOperator('http://example.com')).to.throw('Webhook URL needs to use https');
    });
  });
});

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'utils', 'joinObjects'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    reader: READERS.JSON,
    failWhenNotFound: true
  }
});

function callback(testConf) {
  const {testType} = testConf;
  if (testType === 'joinObjects') {
    return testJoinObjects(testConf);
  }

  throw new Error('Test type not set!');
}

function testJoinObjects({getFixture, arrayOfKeysWanted = false}) {
  const originalObj = getFixture('originalObj.json');
  const objectToBeJoined = undefineValues(getFixture('ojectToBeJoined.json'));
  const resultObject = getFixture('resultObject.json');

  if (arrayOfKeysWanted) {
    joinObjects(originalObj, objectToBeJoined, arrayOfKeysWanted);
    expect(originalObj).to.eql(resultObject);
    return;
  }

  joinObjects(originalObj, objectToBeJoined);
  expect(originalObj).to.eql(resultObject);

  function undefineValues(obj) {
    Object.keys(obj).forEach(key => {
      if (obj[key] === 'undefined') {
        obj[key] = undefined; // eslint-disable-line functional/immutable-data
        return;
      }
    });

    return obj;
  }
}
