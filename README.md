#We.js core module for v0.3.x+

[![Join the chat at https://gitter.im/wejs/we](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/wejs/we?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/wejs/we-core.svg?branch=master)](https://travis-ci.org/wejs/we-core)
[![Dependency Status](https://david-dm.org/wejs/we-core.png)](https://david-dm.org/wejs/we-core)

### Main repository: https://github.com/wejs/we

Site: [http://wejs.org](wejs.org)

Status:  **maintained**

[**Changelog**](CHANGELOG.md)

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

##### For run the code coverage 

```sh
npm run coverage
```

## NPM Info:
[![NPM](https://nodei.co/npm/we-core.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/we-core/)

## License

[the MIT license](LICENSE.md).
