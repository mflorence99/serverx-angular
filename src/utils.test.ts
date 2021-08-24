import { config } from './config';
import { loadApp } from './utils';
import { loadDeployment } from './utils';
import { loadIndex } from './utils';
import { loadServerless } from './utils';
import { transpileServeRX } from './utils';

/**
 * loadApp tests
 */

describe('loadApp unit tests', () => {
  test('load fails when app directory missing', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const files = loadApp('./missing', errors, warnings, infos);
    expect(files.length).toEqual(0);
    expect(errors.length).toEqual(1);
    expect(errors[0]).toContain('ENOENT');
  });

  test('a valid app directory is loaded successfully', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const files = loadApp('./sample/app', errors, warnings, infos);
    expect(files.length).toEqual(7);
    expect(errors.length).toEqual(0);
    expect(warnings.length).toEqual(0);
  });

  test('errors are generated for an invalid app directory', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const files = loadApp('./model', errors, warnings, infos);
    expect(files.length).toBeGreaterThan(0);
    expect(errors.length).toEqual(1);
    expect(errors).toEqual(
      expect.arrayContaining([config.messages.MISSING_INDEX_HTML])
    );
  });
});

/**
 * loadDeployment tests
 */

describe('loadDeployment unit tests', () => {
  test('load fails when deployment file missing', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const deployment = loadDeployment('missing.yml', errors, warnings, infos);
    expect(deployment).toBeUndefined();
    expect(errors.length).toEqual(1);
    expect(errors[0]).toContain('ENOENT');
  });

  test('a valid AWS deployment file is loaded successfully', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const deployment = loadDeployment(
      './sample/deploy/aws.json',
      errors,
      warnings,
      infos
    );
    expect(deployment.environment.BACKEND_ENDPOINT).toEqual(
      'https://admin.appcast.cloud'
    );
    expect(deployment.provider).toEqual('aws');
    expect(deployment.region).toEqual('us-east-1');
    expect(deployment.service).toEqual('serverx-angular');
    expect(deployment.stage).toEqual('dev');
    expect(errors.length).toEqual(0);
    expect(warnings.length).toEqual(0);
  });

  test('a valid Google deployment file is loaded successfully', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const deployment = loadDeployment(
      './sample/deploy/google.json',
      errors,
      warnings,
      infos
    );
    expect(deployment.credentials).toEqual('~/.gcloud/gcf-project-45679.json');
    expect(deployment.environment.BACKEND_ENDPOINT).toEqual(
      'https://admin.appcast.cloud'
    );
    expect(deployment.project).toEqual('gcf-project-45679');
    expect(deployment.provider).toEqual('google');
    expect(deployment.region).toEqual('us-east1');
    expect(deployment.service).toEqual('serverx-angular');
    expect(errors.length).toEqual(0);
    expect(warnings.length).toEqual(0);
  });

  test('errors are generated for an invalid deployment file', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const deployment = loadDeployment(
      './sample/deploy/invalid.yml',
      errors,
      warnings,
      infos
    );
    expect(deployment).toBeDefined();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toEqual(
      expect.arrayContaining([config.messages.BAD_PROVIDER])
    );
    expect(errors).toEqual(
      expect.arrayContaining([config.messages.MISSING_REGION])
    );
    expect(errors).toEqual(
      expect.arrayContaining([config.messages.MISSING_SERVICE])
    );
  });

  test('errors are generated for an invalid AWS deployment file', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const deployment = loadDeployment(
      './sample/deploy/invalid-aws.yml',
      errors,
      warnings,
      infos
    );
    expect(deployment).toBeDefined();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toEqual(
      expect.arrayContaining([config.messages.MISSING_STAGE])
    );
  });

  test('errors are generated for an invalid Google deployment file', () => {
    const errors = [],
      warnings = [],
      infos = [];
    const deployment = loadDeployment(
      './sample/deploy/invalid-google.yml',
      errors,
      warnings,
      infos
    );
    expect(deployment).toBeDefined();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toEqual(
      expect.arrayContaining([config.messages.MISSING_CREDENTIALS])
    );
    expect(errors).toEqual(
      expect.arrayContaining([config.messages.MISSING_PROJECT])
    );
  });

  /**
   * loadIndex tests
   */

  describe('loadIndex unit tests', () => {
    test('properly configure index.html from AWS deployment', () => {
      const errors = [],
        warnings = [],
        infos = [];
      const deployment = loadDeployment(
        './sample/deploy/aws.json',
        errors,
        warnings,
        infos
      );
      const index = loadIndex(deployment, './sample/app');
      expect(index).toContain('<base href="/dev/">');
    });

    test('properly configure index.html from Google deployment', () => {
      const errors = [],
        warnings = [],
        infos = [];
      const deployment = loadDeployment(
        './sample/deploy/google.json',
        errors,
        warnings,
        infos
      );
      const index = loadIndex(deployment, './sample/app');
      expect(index).toContain('<base href="/gcf/">');
    });
  });

  /**
   * loadServerless tests
   */

  describe('loadServerless unit tests', () => {
    test('properly configure serverless.yml from AWS deployment', () => {
      const errors = [],
        warnings = [],
        infos = [];
      const deployment = loadDeployment(
        './sample/deploy/aws.json',
        errors,
        warnings,
        infos
      );
      const serverless = loadServerless(deployment);
      expect(serverless.service).toEqual(deployment.service);
      expect(serverless.provider.stage).toEqual(deployment.stage);
      expect(serverless.provider.region).toEqual(deployment.region);
    });

    test('properly configure serverless.yml from Google deployment', () => {
      const errors = [],
        warnings = [],
        infos = [];
      const deployment = loadDeployment(
        './sample/deploy/google.json',
        errors,
        warnings,
        infos
      );
      const serverless = loadServerless(deployment);
      expect(serverless.service).toEqual(deployment.service);
      expect(serverless.provider.credentials).toEqual(deployment.credentials);
      expect(serverless.provider.project).toEqual(deployment.project);
      expect(serverless.provider.region).toEqual(deployment.region);
    });
  });

  /**
   * transpileServeRX tests
   */

  describe('transpileServeRX unit tests', () => {
    test('properly compile aws.ts from AWS deployment', () => {
      const errors = [],
        warnings = [],
        infos = [];
      const deployment = loadDeployment(
        './sample/deploy/aws.json',
        errors,
        warnings,
        infos
      );
      const serverx = transpileServeRX(deployment);
      expect(serverx.outputText).toContain('exports.aws = aws;');
    });

    test('properly compile google.ts from Google deployment', () => {
      const errors = [],
        warnings = [],
        infos = [];
      const deployment = loadDeployment(
        './sample/deploy/google.json',
        errors,
        warnings,
        infos
      );
      const serverx = transpileServeRX(deployment);
      expect(serverx.outputText).toContain('exports.gcf = gcf;');
    });
  });
});
