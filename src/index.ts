import { Deployment } from './utils';

import { loadApp } from './utils';
import { loadDeployment } from './utils';
import { loadIndex } from './utils';
import { loadServerless } from './utils';
import { transpileServeRX } from './utils';

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as yaml from 'js-yaml';
import * as yargs from 'yargs';

import chalk from 'chalk';

/**
 * serverx-angular deployment script
 *
 * serverx-angular --deploy [file] --app [dir]
 */

const argv = yargs
  .usage('serverx-angular [options]')
  .alias('d', 'deploy')
  .describe('d', 'Deployment JSON or YAML file')
  .alias('a', 'app')
  .describe('a', 'Directory containing Angular app')
  .demandOption(['deploy', 'app'])
  .help(false)
  .version(false)
  .epilog('Serverless deployment of Angular apps using ServeRX-ts').argv;

/**
 * Validate and load deployment file and app dir
 */

const errors: string[] = [];
const warnings: string[] = [];
const infos: string[] = [];

const fileName = argv['deploy'];
console.log(chalk.blueBright(`Loading deployment file ${fileName}...`));
const deployment: Deployment = loadDeployment(
  fileName,
  errors,
  warnings,
  infos
);

const appDir = argv['app'];
console.log(chalk.blueBright(`Loading app directory ${appDir}...`));
const files: string[] = loadApp(appDir, errors, warnings, infos);

errors.forEach((error) => console.log(chalk.red(error)));
warnings.forEach((warning) => console.log(chalk.yellow(warning)));
infos.forEach((info) => console.log(chalk.green(info)));

if (errors.length > 0) process.exit(1);

/**
 * Load the index.html for this deployment
 */

const index = loadIndex(deployment, appDir);

/**
 * Load the serverless.yml for this provider
 */

const serverless = loadServerless(deployment);

/**
 * Create a temp directory and start writing to it
 */

tmp.setGracefulCleanup();
const tmpDir = tmp.dirSync({ unsafeCleanup: true });
console.log(chalk.blueBright(`Building serverless app in ${tmpDir.name}...`));

// all the app files
files.forEach((f) =>
  fs.copyFileSync(f, path.join(tmpDir.name, f.substr(appDir.length)))
);

// overwrite index.html with our tweaked version
fs.writeFileSync(path.join(tmpDir.name, 'index.html'), index);

// write out serverless.yml
fs.writeFileSync(
  path.join(tmpDir.name, 'serverless.yml'),
  yaml.dump(serverless)
);

// emit package.json and install packages
fs.copyFileSync(
  path.join(__dirname, './model/package.json'),
  path.join(tmpDir.name, 'package.json')
);
cp.execSync('npm i --silent', { cwd: tmpDir.name });

// transpile ServrRX-ts harness and emit index.js
const serverx = transpileServeRX(deployment);
fs.writeFileSync(path.join(tmpDir.name, 'index.js'), serverx.outputText);

// finally! -- serverless deploy
cp.execSync('serverless deploy', { cwd: tmpDir.name, stdio: 'inherit' });
