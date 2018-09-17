# We.js core module :green_heart:

[![Join the chat at https://gitter.im/wejs/we](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/wejs/we?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Build Status](https://travis-ci.org/wejs/we-core.svg?branch=master)](https://travis-ci.org/wejs/we-core)

**Main repository: https://github.com/wejs/we **

Site: [http://wejs.org](https://wejs.org)

Status:  **maintained**

[**Changelog**](CHANGELOG.md)

## Install for develop we.js core:

After install npm and node.js

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

## Development:

Run `npm run cw` for compile files in src to lib folder

Only edit code in **src** folder

### How to test

after clone and install npm packages:

```sh
npm test
```

##### For run only 'userFeature' test use:

```sh
we test -g 'resourceRequests'
```

##### For run the code coverage

```sh
npm run coverage
```

## V2 migration

- Breaking changes in ORM: http://docs.sequelizejs.com/manual/tutorial/upgrade-to-v4.html

## License

[the MIT license](LICENSE.md).

## Sponsored by

- Linky Systems: https://linkysystems.com
