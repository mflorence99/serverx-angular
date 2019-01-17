import 'reflect-metadata';

import { Compressor } from 'serverx-ts';
import { CORS } from 'serverx-ts';
import { FILE_SERVER_OPTS } from 'serverx-ts';
import { FileServer } from 'serverx-ts';
import { HttpApp } from 'serverx-ts';
import { RequestLogger } from 'serverx-ts';
import { Route } from 'serverx-ts';

import { createServer } from 'http';

import chalk from 'chalk';

const routes: Route[] = [

  {
    path: '/',
    handler: FileServer,
    middlewares: [Compressor, CORS, RequestLogger],
    services: [{ provide: FILE_SERVER_OPTS, useValue: { root: __dirname } }]
  }

];


const app = new HttpApp(routes);

const listener = app.listen();
const server = createServer(listener)
  .on('listening', () => {
    console.log(chalk.cyanBright(`HttpApp listening on port 4200 deploying from ${__dirname}`));
  });

server.listen(4200);
https://twitter.com/intent/follow?original_referer=https%3A%2F%2Fwww.redstate.com%2Fstreiff%2F2019%2F01%2F16%2Fmsnbc-host-claims-donald-trump-blackmailing-lindsey-graham%2F&ref_src=twsrc%5Etfw&region=follow_link&screen_name=streiffredstate&tw_p=followbutton
