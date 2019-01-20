import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as yaml from 'js-yaml';

import { config } from './config';

/**
 * Model a deployment
 */

export interface Deployment {
  app?: string;
  credentials?: string;
  environment?: { [k: string]: string };
  project?: string;
  provider?: string;
  region?: string;
  service?: string;
  stage?: string;
  tenant?: string;
}

/**
 * Load and validate a deployment YAML file
 */

export function loadApp(appDir: string,
                        errors: string[],
                        warnings: string[],
                        infos: string[]): string[] {
  const files: string[] = [];
  try {
    readdir(appDir, files);
    // there must be an index.html at the top level
    if (!files.some(f => f.endsWith(path.join(appDir, 'index.html'))))
      errors.push(config.messages.MISSING_INDEX_HTML);
    // add an info for each file
    infos.push(...files);
  }
  catch (error) {
    errors.push(error.message);
  }
  return files;
}

/**
 * Load and validate a deployment YAML file
 * 
 * NOTE: simplest possible validation until we later add other providers
 */

export function loadDeployment(fileName: string,
                               errors: string[],
                               warnings: string[],
                               infos: string[]): Deployment {
  let deployment: Deployment;
  try {
    deployment = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
    // validate provider first
    if (!['aws', 'google'].includes(deployment.provider))
      errors.push(config.messages.BAD_PROVIDER);
    // validate required settings
    if (!deployment.app)
      errors.push(config.messages.MISSING_APP);
    if (!deployment.region)
      errors.push(config.messages.MISSING_REGION);
    if (!deployment.service)
      errors.push(config.messages.MISSING_SERVICE);
    if (!deployment.tenant)
      errors.push(config.messages.MISSING_TENANT);
    // validate required provider-dependent settings
    switch (deployment.provider) {
      case 'aws':
        if (!deployment.stage)
          errors.push(config.messages.MISSING_STAGE);
        break;
      case 'google':
        if (!deployment.credentials)
          errors.push(config.messages.MISSING_CREDENTIALS);
        if (!deployment.project)
          errors.push(config.messages.MISSING_PROJECT);
        if (!deployment.stage)
          warnings.push(config.messages.OMITTED_STAGE);
        break;
    }
  }
  catch (error) {
    errors.push(error.message);
  }
  return deployment;
}

/**
 * Load the index.html for this deployment
 * 
 * NOTE: we need to tweak this file before writing it
 */

export function loadIndex(deployment: Deployment,
                          appDir: string): string {
  let index = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
  // replace base tag
  let base;
  switch (deployment.provider) {
    case 'aws':
      base = `<base href="/${deployment.stage}/">`;
      break;
    case 'google':
      base = '<base href="/gcf/">';
      break;
  }
  index = index.replace(/<base href=".*">/, base);
  // inject any env vars
  if (deployment.environment) {
    const ix = index.indexOf('</head>');
    if (ix !== -1) {
      index = index.substring(0, ix)
        + `<script>var ENV = ${JSON.stringify(deployment.environment)};</script>`
        + index.substring(ix);
    }
  }
  return index;
}

/**
 * Load the serverless YAML file
 *
 * NOTE: simplest possible logic until we later add other providers
 */

export function loadServerless(deployment: Deployment): any {
  const fileName = `./model/${deployment.provider}.yml`;
  const serverless = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
  // jam in common deployment settings
  serverless.app = deployment.app;
  serverless.service = deployment.service;
  serverless.tenant = deployment.tenant;
  serverless.provider.region = deployment.region;
  // jam in provider-dependent deployment settings
  switch (deployment.provider) {
    case 'aws':
      serverless.provider.stage = deployment.stage;
      break;
    case 'google':
      serverless.provider.credentials = deployment.credentials;
      serverless.provider.project = deployment.project;
      // NOTE: stage is optional for Google
      if (deployment.stage)
        serverless.provider.stage = deployment.stage;
      break;
  }
  return serverless;
}

/**
 * Transpile the ServeRX-ts harness
 */

export function transpileServeRX(deployment: Deployment): any {
  const fileName = `./model/${deployment.provider}.ts`;
  return ts.transpileModule(fs.readFileSync(fileName, 'utf8'), {
    compilerOptions: config.compilerOptions
  });
}

/**
 * Private functions
 */

// @see https://gist.github.com/timoxley/0cb5053dec107499c8aabad8dfd651ea
function readdir(dir: string,
                 allFiles: string[]): string[] {
  const files = fs.readdirSync(dir).map(f => path.join(dir, f));
  allFiles.push(...files);
  files
    .filter(f => fs.statSync(f).isDirectory())
    .forEach(d => readdir(d, allFiles));
  return allFiles;
}
