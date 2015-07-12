#We.js core module for v0.3.x+

[![Build Status](https://travis-ci.org/wejs/we-core.svg?branch=master)](https://travis-ci.org/wejs/we-core)
[![Code Climate](https://codeclimate.com/github/wejs/we-core/badges/gpa.svg)](https://codeclimate.com/github/wejs/we-core)
[![Test Coverage](https://codeclimate.com/github/wejs/we-core/badges/coverage.svg)](https://codeclimate.com/github/wejs/we-core)
[![Dependency Status](https://david-dm.org/wejs/we-core.png)](https://david-dm.org/wejs/we-core)

### Main repository: https://github.com/wejs/we

Site: [http://wejs.org](wejs.org)

***In active developement***

## Install for develop we.js core:

> after install npm and node.js

```js
// clone this project
git clone https://github.com/wejs/we-core.git
// enter in cloned folder
cd we-core
// install all dependencies
npm install
// test
npm test
```

### How to test

after clone and install npm packages:

```sh
npm test
```

##### For run only 'userFeature' test use:

```sh
NODE_ENV=test LOG_LV=info ./node_modules/.bin/mocha test/bootstrap.js test/**/*.test.js -b -g 'userFeature'
```

##### For run the javascript linter

```sh
npm run lint
```

#Copyright and license

Copyright 2013-2014 Alberto Souza <contato@albertosouza.net> and [contributors](https://github.com/wejs/we-core/graphs/contributors) , under [the MIT license](LICENSE).
