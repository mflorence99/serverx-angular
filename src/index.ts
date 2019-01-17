import 'reflect-metadata';

import { AWSLambdaApp } from 'serverx-ts';
import { BinaryTyper } from 'serverx-ts';
import { Compressor } from 'serverx-ts';
import { CORS } from 'serverx-ts';
import { FILE_SERVER_OPTS } from 'serverx-ts';
import { FileServer } from 'serverx-ts';
import { GCFApp } from 'serverx-ts';
import { Route } from 'serverx-ts';

const routes: Route[] = [

  {
    path: '/',
    methods: ['GET'],
    handler: FileServer,
    middlewares: [BinaryTyper, Compressor, CORS],
    services: [
      { provide: FILE_SERVER_OPTS, useValue: { root: __dirname } }
    ]
  }

];

const awsApp = new AWSLambdaApp(routes);
export function aws(event, context) {
  return awsApp.handle(event, context);
}

const gcfApp = new GCFApp(routes);
export function gcf(req, res) {
  gcfApp.handle(req, res);
}
