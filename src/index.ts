import { Deployment } from './utils';

import { baseHref } from './utils';
import { loadApp } from './utils';
import { loadDeployment } from './utils';
import { loadIndex } from './utils';
import { loadServerless } from './utils';
import { transpileServeRX } from './utils';

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
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
  .alias('x', 'dryrun')
  .describe('x', "Dry run, don't deploy")
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
console.log(chalk.blue(`Loading deployment file ${fileName}...`));
const deployment: Deployment = loadDeployment(
  fileName,
  errors,
  warnings,
  infos
);

const appDir = argv['app'];
console.log(chalk.blue(`Loading app directory ${appDir}...`));
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

const tmpDir = path.join(path.dirname(appDir), 'tmp');
rimraf.sync(tmpDir);
fs.mkdirSync(tmpDir, { recursive: true });

const deployDir = path.join(tmpDir, 'deploy');
fs.mkdirSync(deployDir, { recursive: true });

console.log(chalk.blue(`Building serverless app in ${tmpDir}...`));

// all the app files
console.log(chalk.blue('...copying app files'));
files.forEach((f) => {
  const t = path.join(deployDir, f.substr(appDir.length));
  try {
    fs.copyFileSync(f, path.join(deployDir, f.substr(appDir.length)));
  } catch (error) {
    fs.mkdirSync(t, { recursive: true });
  }
});

// overwrite index.html with our tweaked version
console.log(chalk.blue('...rebuilding index.html'));
fs.writeFileSync(path.join(deployDir, 'index.html'), index);

// we must rebuild ngsw.json because we tweaked index.html
if (fs.existsSync(path.join(deployDir, 'ngsw.json'))) {
  console.log(chalk.blue('...rebuilding ngsw.json'));
  let ngswDir = appDir;
  while (!fs.existsSync(path.join(ngswDir, 'ngsw-config.json')))
    ngswDir = path.dirname(ngswDir);
  const base = baseHref(deployment);
  const ngswConfig = path.join(ngswDir, 'ngsw-config.json');
  console.log(
    chalk.yellow(`npx ngsw-config ${deployDir} ${ngswConfig} /${base}`)
  );
  cp.execSync(`npx ngsw-config ${deployDir} ${ngswConfig} /${base}`, {
    cwd: path.dirname(ngswDir),
    stdio: 'inherit'
  });
}

// write out serverless.yml
console.log(chalk.blue('...emitting serverless.yml'));
fs.writeFileSync(path.join(deployDir, 'serverless.yml'), yaml.dump(serverless));

// install packages for deployment
console.log(chalk.blue('...installing deployment dependencies'));
fs.copyFileSync(
  path.join(__dirname, './model/package.json'),
  path.join(deployDir, 'package.json')
);
cp.execSync('npm i --silent serverx-ts', { cwd: deployDir });

// now do the same one level up for the serverless build
console.log(chalk.blue('...installing build dependencies'));
fs.copyFileSync(
  path.join(__dirname, './model/package.json'),
  path.join(tmpDir, 'package.json')
);
switch (deployment.provider) {
  case 'aws':
    cp.execSync('npm i --silent serverless-apigw-binary', {
      cwd: tmpDir
    });
    if (deployment.domainName) {
      cp.execSync('npm i --silent serverless-domain-manager', {
        cwd: tmpDir
      });
    }
    break;
  case 'google':
    cp.execSync('npm i --silent serverless-google-cloudfunctions', {
      cwd: tmpDir
    });
    break;
}

// transpile ServrRX-ts harness and emit index.js
console.log(chalk.blue('...transpiling ServeRX-ts driver'));
const serverx = transpileServeRX(deployment);
fs.writeFileSync(path.join(deployDir, 'index.js'), serverx.outputText);

// finally! -- serverless deploy
if (!argv['dryrun'])
  cp.execSync('serverless deploy', { cwd: deployDir, stdio: 'inherit' });
