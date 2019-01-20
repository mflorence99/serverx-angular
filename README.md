# ServeRX-angular

[![Build Status](https://travis-ci.org/mflorence99/serverx-angular.svg?branch=master)](https://travis-ci.org/mflorence99/serverx-angular) 
[![Jest Coverage](./coverage.svg)]()
[![npm](https://img.shields.io/npm/v/serverx-angular.svg)]()
[![node](https://img.shields.io/badge/node-8.10-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![NPM](https://nodei.co/npm/serverx-angular.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/serverx-angular/)

Deploy [Angular](https://angular.io/docs) applications to serverless environments using [ServeRX-ts](https://github.com/mflorence99/serverx-ts).

<!-- toc -->

- [Where's the Beef?](#wheres-the-beef)
- [How to Install ServeRX-angular](#how-to-install-serverx-angular)
  * [Install `serverless`](#install-serverless)
  * [Install ServeRX-angular](#install-serverx-angular)
- [How to Prepare Your Angular App](#how-to-prepare-your-angular-app)
  * [Deployment File Contents](#deployment-file-contents)
    + [AWS Lambda Example](#aws-lambda-example)
    + [Google Cloud Functions Example](#google-cloud-functions-example)
    + [Settings](#settings)
    + [`environment` Setting](#environment-setting)
- [How to Deploy Your Angular App](#how-to-deploy-your-angular-app)
- [How it Works](#how-it-works)

<!-- tocstop -->

## Where's the Beef?

[serverless](https://serverless.com/framework/) is an indispensable framework and in fact ServeRX-angular relies on it entirely to perform its deployments. Furthermore, [ng-toolkit](https://github.com/maciejtreder/ng-toolkit) is a thorough and ingenious tool that uses [Angular schematics](https://blog.angular.io/schematics-an-introduction-dc1dfbc2a2b2) to bake support for serverless deployments directly into an Angular app.

However, ServeRX-angular takes a different approach, with two objectives:

1. Allow the serverless deployment of _any_ Angular app, with no changes, no dependencies and in fact without the app developers having any knowledge of the eventual deployment.

2. Put the experimental [ServeRX-ts](https://github.com/mflorence99/serverx-ts) to the test by using it as the server-side driver.

> ServeRX-angular currently supports AWS Lambda and Google Cloud Functions. Support for other providers (for example, Azure) is planned for later.

Of course, the Angular app you deploy is only the front-end half of your entire application. You will also deploy a back-end app, perhaps one that exposes a RESTful API to the front-end and perhaps one that itself is deployed serverless. The experimental [ServeRX-ts](https://github.com/mflorence99/serverx-ts) could serve as the framework for this app. 

## How to Install ServeRX-angular

### Install `serverless`

```sh
# Step 1. Install serverless globally
npm install serverless -g

# Step 2. Login to your serverless account
serverless login
```

If you don't yet have an account, you'll be prompted to sign up for one. Once you login, you'll be directed to the [serverless dashboard](https://dashboard.serverless.com) where you'll need to create an app for each serverless Angular app that you intend to deploy.

> The name you give to your app here will later be used as the `app` setting to ServeRX-angular and your `serverless` user name will be used as the `tenant` setting.

`serverless` has excellent [documentation](https://serverless.com/framework/docs/providers) on how it interacts with the providers it supports. In particular, these documents are particularly helpful:

* [AWS - Credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/) shows how to create an AWS account (if necessary) and store its credentials on your development computer or CI server. Once done, no additional steps are necessary, no matter how many applications you deploy.

* Setting up Google is more complex. [Google -Credentials](https://serverless.com/framework/docs/providers/google/guide/credentials/) shows step-by-step how to create a Google Cloud account, a Google Cloud Project and associated service account, and how to download and store its credentials. You will need to do this for every app you deploy.

### Install ServeRX-angular

```sh
# ServeRX-angular should be installed globally
npm install serverx-angular -g
```

## How to Prepare Your Angular App

In keeping with the ServeRX-angular objectives, no special preparation of your Angular app is necessary. Instead, you just need to point to its `dist` directory. Typically the `dist` directory you need is created by running `ng build --prod --aot` or some variant.

> Your app may be in an inner directory, whose name is the name of the app as known to the Angular CLI. In ths case, ServeRX-angular needs that inner directory, for example `./dist/hello-world`.

You must also create a deployment YAML or JSON file to describe the serverless deployment of your app to ServeRX-angular. You might have different versions of this file and your development computer and your CI or build servers.

> Either YAML or JSON syntax can be used, although this document uses JSON for illustration.

### Deployment File Contents

Create a deployment file for your app following the examples below. You may have different deployment files in arbitrary locations on each of your development computers and CI or build servers.

#### AWS Lambda Example

```json
{
  "app": "serverx-angular",
  "environment": {
    "BACKEND_ENDPOINT": "https://admin.appcast.cloud"
  },
  "provider": "aws",
  "region": "us-east-1",
  "service": "serverx-angular",
  "stage": "dev",
  "tenant": "mflorence99"
}
```

#### Google Cloud Functions Example

```json
{
  "app": "serverx-angular",
  "credentials": "~/.gcloud/gcf-project-45679.json",
  "environment": {
    "BACKEND_ENDPOINT": "https://admin.appcast.cloud"
  },
  "project": "gcf-project-45679",
  "provider": "google",
  "region": "us-east1",
  "service": "serverx-angular",
  "stage": "dev",
  "tenant": "mflorence99"
}
```

#### Settings

Setting | Required? | Explanation
--- | --- | ---
`app` | yes | The name of your app, as on the [serverless dashboard](https://dashboard.serverless.com)
`credentials` | Google only | The location of the Google credentials for this project
`environment` | no | See below
`project` | Google only | The name of your Google Cloud project
`provider` | yes | Must be either `aws` or `google`
`region` | yes | The provider's region code
`service` | yes | TODO: Use the same name as for `app`
`stage` | Optional for Google | The provider's stage name (eg: `dev`)
`tenant` | yes | Your `serverless` user name

#### `environment` Setting

The provisioning of server-side environment variables is a standard feature for all providers. In Node.js, they are typically accessed through `process.env`. However, your deployed Angular app does not have and does not need visibility to the server-side code, so ServeRX-angular uses this setting as follows.

> This feature is experimental and included because it follows the [12 Factor](https://12factor.net/) principles we use at [Appcast](https://appcast.io).

If you supply the `environment` setting, its values are inserted into your `index.html` _as it is deployed_ (not in the original) and before the `</head>` closure like this:

```html
<script>
  var ENV = { /* your settings */ }
</script>
```

Front-end code can now use these settings, for example, to determine the correct back-end endpoint.

> At [Appcast](https://appcast.io) we use an Angular service as a facade over the `ENV` global.

## How to Deploy Your Angular App

Now all the setup is out of the way, deployment is easy. In fact, a sample Angular app and corresponding deployment settings are supplied in the [sample](https://github.com/mflorence99/serverx-angular/tree/master/sample) folder of this repo.

```sh
serverx-angular --app this/that/dist/app-name --deploy somewhere/else/app-name.json
```

## How it Works

XX
