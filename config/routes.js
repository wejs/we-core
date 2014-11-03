/**
 * Routes
 *
 * Sails uses a number of different strategies to route requests.
 * Here they are top-to-bottom, in order of precedence.
 *
 * For more information on routes, check out:
 * http://sailsjs.org/#documentation
 */



/**
 * (1) Core middleware
 *
 * Middleware included with `app.use` is run first, before the router
 */


/**
 * (2) Static routes
 *
 * This object routes static URLs to handler functions--
 * In most cases, these functions are actions inside of your controllers.
 * For convenience, you can also connect routes directly to views or external URLs.
 *
 */

module.exports.routes = {

  '/configs.js': {
    controller: 'main',
    action: 'getConfigsJS'
  },

  '/api/v1/translations.js': {
    controller: 'main',
    action: 'getTranslations'
  },


  '/': {
    controller: 'main',
    action: 'index'
    //view: 'home/index'
  },

  // Standard RESTful routing

  // -- USERS

  // User Auth

  'get /api/v1/auth/callback/:access_token': {
    controller    : 'auth',
    action        : 'oauth2Callback'
  },

  '/auth/logout': {
    controller    : 'auth',
    action        : 'logOut'
  },

  // -- POSTS
  // @todo check ir this route set is need
  // 'get /api/v1/post': {
  //   controller    : 'post',
  //   action        : 'list'
  // },

  // 'get /api/v1/post/:id': {
  //     controller    : 'post',
  //     action        : 'findOneRecord'
  // },

  // // @todo check ir this route set is need
  // 'post /api/v1/post': {
  //   controller    : 'post',
  //   action        : 'createRecord'
  // },

  // 'put /api/v1/post': {
  //   controller    : 'post',
  //   action        : 'updateRecord'
  // },

  // -- Pub Sub
  //
  // subscribe from socket.io updates
  'post /api/v1/subscribe': {
      controller    : 'PubsubController',
      action        : 'subscribe'
  },
  // unsubscribe from socket.io updates
  'post /api/v1/unsubscribe': {
      controller    : 'PubsubController',
      action        : 'unsubscribe'
  }
};



/**
 * (3) Action blueprints
 * These routes can be disabled by setting (in `config/controllers.js`):
 * `module.exports.controllers.blueprints.actions = false`
 *
 * All of your controllers ' actions are automatically bound to a route.  For example:
 *   + If you have a controller, `FooController`:
 *     + its action `bar` is accessible at `/foo/bar`
 *     + its action `index` is accessible at `/foo/index`, and also `/foo`
 */


/**
 * (4) Shortcut CRUD blueprints
 *
 * These routes can be disabled by setting (in config/controllers.js)
 *      `module.exports.controllers.blueprints.shortcuts = false`
 *
 * If you have a model, `Foo`, and a controller, `FooController`,
 * you can access CRUD operations for that model at:
 *    /foo/find/:id?  ->  search lampshades using specified criteria or with id=:id
 *
 *    /foo/create   ->  create a lampshade using specified values
 *
 *    /foo/update/:id ->  update the lampshade with id=:id
 *
 *    /foo/destroy/:id  ->  delete lampshade with id=:id
 *
 */

/**
 * (5) REST blueprints
 *
 * These routes can be disabled by setting (in config/controllers.js)
 *    `module.exports.controllers.blueprints.rest = false`
 *
 * If you have a model, `Foo`, and a controller, `FooController`,
 * you can access CRUD operations for that model at:
 *
 *    get /foo/:id? ->  search lampshades using specified criteria or with id=:id
 *
 *    post /foo   -> create a lampshade using specified values
 *
 *    put /foo/:id  ->  update the lampshade with id=:id
 *
 *    delete /foo/:id ->  delete lampshade with id=:id
 *
 */

/**
 * (6) Static assets
 *
 * Flat files in your `assets` directory- (these are sometimes referred to as 'public')
 * If you have an image file at `/assets/images/foo.jpg`, it will be made available
 * automatically via the route:  `/images/foo.jpg`
 *
 */



/**
 * (7) 404 (not found) handler
 *
 * Finally, if nothing else matched, the default 404 handler is triggered.
 * See `config/404.js` to adjust your app's 404 logic.
 */

