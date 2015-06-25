var _ = require('lodash');
var uploader = require('./middlewares/uploader');

var router = {
  routeMap: {}
};

/**
 * Bind one we.js route
 *
 * This function bind context loader, acl, upload and controller middlewares
 *
 * @param  {Object} we     we.js object
 * @param  {String} route  route like "get /route"
 * @param  {Object} config route configs
 */
router.bindRoute = function bindRoute(we, route, config) {
  var method, path;
  // parse method and url
  var r = route.split(' ');
  if (r.length > 1) {
    method = r[0];
    path = r[1];
  } else {
    method = 'get';
    path = r[0];
  }

  if (config.method) {
    method = config.method;
  }

  var actionFunction = '';
  // search for the controller action to bind
  if (
    we.controllers[config.controller] &&
    we.controllers[config.controller][config.action]
  ) {
    actionFunction = we.controllers[config.controller][config.action];
  } else {
    return we.log.warn('we.router.bindRoute: Unknow controller or action:', path, config);
  }

  var middlewares = [
    // bind context loader
    router.contextLoader.bind({
      config: config
    }),
    // bind acl middleware
    we.acl.canMiddleware.bind({
      config: config
    })
  ];

  we.events.emit('router:add:acl:middleware', {
    we: we, middlewares: middlewares, config: config
  });

  // bind upload  if have config and after ACL check
  if (config.upload) {
    middlewares.push(uploader(config.upload));
  }

  we.events.emit('router:before:set:controller:middleware', {we: we, middlewares: middlewares, config: config});
  // bind contoller
  middlewares.push(actionFunction);

  we.express[method](path, middlewares);

  var mapName = config.name;
  if (!mapName) {
    mapName = config.controller + '.' + config.action;
  }

  if (!we.router.routeMap[method]) we.router.routeMap[method] = {};

  // map get routes for use with link-to
  we.router.routeMap[method][mapName] = {
    map: router.parseRouteToMap(path),
    config: config
  };

  we.log.silly('Route bind:', method ,path);
}

// absolute url regex tester
var absoluteUrlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');
/**
 * Check if one url is absolute or relative
 *
 * @param  {String}  str url to check
 * @return {Boolean}     Returns true for absolute and false to relative
 */
router.isAbsoluteUrl = function isAbsoluteUrl(str) {
  return absoluteUrlRegex.test(str);
}

router.parseRouteToMap = function parseRouteToMap(route) {
  return route.split('/').map(function(r, i){
    if(r[0] === ':'){
      return { name: r, i: i };
    } else {
      return r;
    }
  });
}

router.urlTo = function urlTo(name, params ,we) {
  var url = '';
  var route = {};

  if (we.router.routeMap.get[name]) {
    route = we.router.routeMap.get[name];
    var mapI = 0;
    for (var i = 0; i < route.map.length; i++) {
      // skip empty path parts linke  // and fist /
      if (!route.map[i]) continue;
      if (typeof route.map[i] == 'string') {
        url += '/' + route.map[i];
      } else if (params && params[mapI]){
        url += '/' + params[mapI];
        mapI++;
      } else {
        we.log.warn('Invalid or undefined argument: ' + params +' ', route.map[i]);
      }
    }
  } else {
    we.log.warn('Route map not found: ' + name);
  }

  if (route.map && route.map.length && !url) url = '/';

  return url;
}

/**
 * Context loader middleware
 */
router.contextLoader = function contextLoader(req, res, next) {
  // only load context one time per request
  if (req.weContextLoaded) return next();

  var we = req.getWe();
  // save current user reference
  res.locals.currentUser = req.user;
  // get route configs
  var config = this.config;
  // merge context var with route configs
  _.merge(res.locals, config);

  router.parseQuery(req, res, function(err, query) {
    res.locals.query = query;
    if (!res.locals.model ) return contextLoaded();
    // set model class
    res.locals.Model = we.db.models[res.locals.model];
    // set id if exists and not is set
    if (!res.locals.id) {
      if (req.params[res.locals.model + 'Id']) {
        res.locals.id = req.params[res.locals.model + 'Id'];
      } else if (req.params.id) {
        res.locals.id = req.params.id;
      }
    }

    // set load current record flag for single records requests
    res.locals.loadCurrentRecord = router.needLoadCurrentModel(req, res);
    // default template
    if (!res.locals.template)
      res.locals.template = res.locals.model + '/' + res.locals.action;

    // run model context loader if exists
    if (
      we.db.models[res.locals.model] &&
      typeof we.db.models[res.locals.model].contextLoader == 'function'
    ) {
      we.db.models[res.locals.model].contextLoader(req, res, function afterRunModelContextLoader(err) {
        return contextLoaded(err);
      });
    } else {
      return contextLoaded();
    }

    function contextLoaded(err) {
      req.weContextLoaded = true;
      if (err) return next(err);

      router.title.middleware(req, res, function(){
        if (!req.user) return next();
        // preload user roles
        return req.user.getRoles().then(function (result) {
          next(null, result);
        });
      });
    }
  });
}

/**
 * We.js title middleware handlers
 */
router.title = {
  middleware: function titleMiddleware(req, res, next) {
    if (res.locals.titleHandler) {
      if (typeof res.locals.titleHandler === 'function') {
        return res.locals.titleHandler(req, res, next);
      } else if (router.title.middlewares[res.locals.titleHandler]) {
        return router.title.middlewares[res.locals.titleHandler](req, res, next);
      }
    }

    next();
  },
  middlewares: {
    i18n: function i18n(req, res, next) {
      res.locals.title = req.__(res.locals.titleI18n);
      next();
    },

    recordField: function recordField(req, res, next) {
      if (res.locals.record)
        res.locals.title = res.locals.record[res.locals.titleField];

      next();
    }
  }
}

/**
 * Add one route after 404 middleware
 */
router.liveBindRoute = function bindRoute(we, route, config) {
  var allRoutes = we.express._router.stack;
  we.router.bindRoute(we, route, config);
  // push this new route to after 404 and error middlewares
  allRoutes.splice(allRoutes.length-3, 0, allRoutes.splice(allRoutes.length-1, 1)[0]);
}

// router.bindShadownRoutes = function bindShadownRoutes(we, cb) {
//   if (!we.db.models || !we.controllers) return cb();

//   var modelNames = Object.keys(we.db.models);

//   var shadownRoutesToBind = [];
//   for (var i = modelNames.length - 1; i >= 0; i--) {
//     if (router.haveShadownRoute(we,  modelNames[i])) {
//       shadownRoutesToBind.push(modelNames[i]);
//     }
//   }

//   shadownRoutesToBind.forEach(function(model) {
//     // get / find
//     router.bindShadownFindRoute(we, model);
//     // post / create
//     router.bindShadownCreateRoute(we, model);
//     // get :id / findOne
//     router.bindShadownFindOneRoute(we, model);
//     // put / update
//     router.bindShadownUpdateRoute(we, model);
//     // delete / destroy
//     router.bindShadownDeleteRoute(we, model);
//   });

//   cb();
// }

/**
 * Check if one model have shadownRoutes
 *
 * @param  {Object} we        We.js object
 * @param  {String} modelName
 * @return {Boolean}
 */
router.haveShadownRoute = function haveShadownRoute(we, modelName) {
  if ( !we.controllers[modelName] || !we.db.models[modelName] ) return false;
  if ( we.controllers[modelName] &&
    we.controllers[modelName]._config &&
    (we.controllers[modelName]._config.shadownRoutes === false)
  ) {
    return false;
  }
  return true;
}

// -- wejs shadown routes bind functions, override if need something diferent

/**
 * Bind find shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownFindRoute = function bindShadownFindRoute(we, model) {
  var configs  = {
    action: 'find',
    model: model,
    controller: model
  };

  var route = '/' + model;

  we.router.bindRoute(we, route, configs);
}

/**
 * Bind create shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownCreateRoute = function bindShadownCreateRoute(we, model) {
  var configs  = {
    method: 'post',
    action: 'create',
    model: model,
    controller: model
  };

  var route = 'post /' + model;

  we.router.bindRoute(we, route, configs);
}


router.bindShadownGenericRoute = function bindShadownGenericRoute(we, model, action, method) {
  var configs  = {
    method: method,
    action: action,
    model: model,
    controller: model
  };

  var route = method + ' /' + model + '/:id';

  we.router.bindRoute(we, route, configs);
}


/**
 * Bind findOne shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownFindOneRoute = function bindShadownFindOneRoute(we, model) {
  router.bindShadownGenericRoute(we, model, 'findOne', 'get');
}

/**
 * Bind update shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownUpdateRoute = function bindShadownUpdateRoute(we, model) {
  router.bindShadownGenericRoute(we, model, 'update', 'put');
}

/**
 * Bind delete shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownDeleteRoute = function bindShadownDeleteRoute(we, model) {
  router.bindShadownGenericRoute(we, model, 'destroy', 'delete');
}

/**
 * Bind updateAtribute shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownUpdateAtributeRoute = function bindShadownUpdateAtributeRoute(we, model) {
  var configs  = {
    method: 'put',
    action: 'updateAtribute',
    model: model,
    controller: model
  };

  var route = 'put /' + model + '/:id/:atribute';
  we.router.bindRoute(we, route, configs);
}


router.singleRecordActions = [
  'findOne', 'update', 'destroy', 'updateAttribute',
  'deleteAttribute', 'addRecord', 'removeRecord', 'getRecord', 'editPage'
];

router.needLoadCurrentModel = function needLoadCurrentModel(req, res) {
  if (res.locals.loadRecord === false) return false;
  if (res.locals.loadRecord === true) return true;

  if (!res.locals.action) return false;

  if ( router.singleRecordActions.indexOf( res.locals.action ) >-1 ) {
    return true;
  }
}

/**
 * Parse query for current request
 */
router.parseQuery = function parseQuery(req, res, next) {
  var we = req.getWe();
  var query = {
    // set subQuery to false by default
    subQuery: false,
    where: {}
  };

  if (res.locals.skipParseQuery) return query;

  if (req.query.offset) {
    query.offset = req.query.offset;
  } else if (req.query.skip) {
    query.offset = req.query.skip;
  }

  if (req.query.limit) {
    query.limit = req.query.limit;
  }

  if (req.query.order) {
    query.order = res.locals.model + '.' +req.query.order;
  } else if (req.query.sort) {
    query.order = res.locals.model + '.' +req.query.sort;
  }

  query.include = [{ all: true,  attributes: ['id'] }];

  // parse where
  try {
    if (req.query.where) query.where = JSON.parse( req.query.where );
  } catch(e) {
    we.log.warn('req.query.where have a invalid format', req.query.where);
    return res.badRequest();
  }

  // parse associations
  if (res.locals.model && we.db.models[res.locals.model]) {
    // we.log.info('Models>',we.db.models[res.locals.model]);

    if (we.db.models[res.locals.model].associations) {
      var assocFields = Object.keys(we.db.models[res.locals.model].associations);
      var identifier;
      for (var i = assocFields.length - 1; i >= 0; i--) {
        identifier = we.db.models[res.locals.model].associations[assocFields[i]].identifier;
        // parse in body params
        if (req.body && req.body[assocFields[i]]) {
          req.body[identifier] = req.body[assocFields[i]];
        }
        // parse in where
        if (query.where && query.where[assocFields[i]]) {
          query.where[identifier] = query.where[assocFields[i]];
        }
      }
    }
  }

  return next(null, query);
}

module.exports = router;
