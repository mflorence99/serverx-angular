/**
 * Common configuration settings
 */

export class Config {

  compilerOptions: any = {
    alwaysStrict: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    lib: [
      'dom',
      'es2017'
    ],
    module: 'commonjs',
    moduleResolution: 'node',
    noEmitOnError: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    noUnusedParameters: false,
    pretty: true,
    suppressImplicitAnyIndexErrors: true,
    target: 'es2017',
    typeRoots: [
      'node_modules/@types'
    ]
  };

  messages = {
    BAD_PROVIDER: '...provider must be aws or google',
    MISSING_APP: '...app is missing',
    MISSING_CREDENTIALS: '...credentials are missing',
    MISSING_INDEX_HTML: '...index.html is missing',
    MISSING_PROJECT: '...project is missing',
    MISSING_REGION: '...region is missing',
    MISSING_SERVICE: '...service is missing',
    MISSING_STAGE: '...stage is missing',
    MISSING_TENANT: '...tenant is missing',
  };

}

export const config = new Config();
