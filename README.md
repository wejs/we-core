#We.js core module for v0.3.x+

### Main repository: https://github.com/wejs/we

Site: wejs.org

###In research and developement dont use this repository

### How to test

#### In this project folder

##### For run all tests use:

```sh
npm test
```

##### For run only 'userFeature' test use:

```sh
NODE_ENV=test LOG_LV=info ./node_modules/.bin/mocha test/bootstrap.js test/**/*.test.js -g 'userFeature'
```

##Features:

- User register and authentication
- Image upload and resize
- Plugins
- Themes
- Admin interface
- Terms, tags and vocabulary
- Comments

## Links

> * Team: https://github.com/orgs/wejs/people
> * Contributors: https://github.com/wejs/we-core/graphs/contributors
> * Sails.js  http://sailsjs.org - some code is get from sails.js

#Copyright and license

Copyright 2013-2014 Alberto Souza <contato@albertosouza.net> and [contributors](https://github.com/wejs/we-core/graphs/contributors) , under [the MIT license](LICENSE).
