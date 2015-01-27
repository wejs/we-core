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

  // ember.js models generated from sails.js models
  'get /api/v1/models/emberjs': {
    controller: 'main',
    action: 'getAllModelsAsEmberModel'
  },

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
  },

  'get /api/v1/fetchActionPermissions': {
      controller    : 'PermissionController',
      action        : 'fetchActionPermissions'
  }

};


// /api/v1/relato/titulo/:id