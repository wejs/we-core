var _ = require('lodash');
var uploader = require('./middlewares/uploader');

var router = {};

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
  if ( we.controllers[config.controller] && we.controllers[config.controller][config.action] ) {
    actionFunction = we.controllers[config.controller][config.action];
  } else {
    return we.log.warn('we.router.bindRoute: Unknow controller or action:', path, config);
  }

  we.express[method](path,
    // bind context loader
    router.contextLoader.bind({
      config: config
    }),
    // bind acl middleware
    we.acl.canMiddleware.bind({
      config: config
    })
  );

  // bind upload  if have config and after ACL check
  if (config.upload) {
    we.express[method](path, uploader(config.upload) );
  }

  // bind contoller
  we.express[method](path, actionFunction);

  we.log.silly('Route bind:', method ,path);
}

/**
 * Context loader middleware
 */
router.contextLoader = function contextLoader(req, res, next) {
  // only load context one time per request
  if (req.weContextLoaded) return next();

  var we = req.getWe();

  // get route configs
  var config = this.config;
  // merge context var with route configs
  _.merge(res.locals, config);

  res.locals.metadata = {};
  // set user role names array
  req.userRoleNames = [];

  if (res.header) {
    // set header to never cache API responses for skip IE 11 cache bug
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
  }

  router.parseQuery(req, res, function(err, query) {
    res.locals.query = query;
    if (!res.locals.model ) return contextLoaded();

    // set model class
    res.locals.Model = we.db.models[res.locals.model];
    // set id if exists
    res.locals.id = req.params.id;
    // set load current record flag for single records requests
    res.locals.loadCurrentRecord = router.needLoadCurrentModel(req, res);

    // default template
    res.locals.template = res.locals.model + '/' + res.locals.action;

    // run model context loader if exists
    if (typeof we.db.models[res.locals.model].contextLoader == 'function' ) {
      we.db.models[res.locals.model].contextLoader(req, res, function afterRunModelContextLoader(err) {
        return contextLoaded(err);
      });
    } else {
      return contextLoaded();
    }

    function contextLoaded(err) {
      req.weContextLoaded = true;

      if (err) return next(err);

      if (!req.user) {
        return next();
      }

      return req.user.getRoles().done(next);
    }
  });
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

/**
 * Bind findOne shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownFindOneRoute = function bindShadownFindOneRoute(we, model) {
  var configs  = {
    method: 'get',
    action: 'findOne',
    model: model,
    controller: model
  };

  var route = 'get /' + model + '/:id';

  we.router.bindRoute(we, route, configs);
}

/**
 * Bind update shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownUpdateRoute = function bindShadownUpdateRoute(we, model) {
  var configs  = {
    method: 'put',
    action: 'update',
    model: model,
    controller: model
  };

  var route = 'put /' + model + '/:id';

  we.router.bindRoute(we, route, configs);
}

/**
 * Bind delete shadown route
 *
 * @param  {object} we      we.js object
 * @param  {string} model   model Name, same as controller name
 */
router.bindShadownDeleteRoute = function bindShadownDeleteRoute(we, model) {
  var configs  = {
    method: 'delete',
    action: 'destroy',
    model: model,
    controller: model
  };

  var route = 'delete /' + model + '/:id';
  we.router.bindRoute(we, route, configs);
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
  'findOne', 'update', 'destroy', 'updateAttribute', 'deleteAttribute', 'addRecord', 'removeRecord', 'getRecord'
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

  // set subquery to false by defalt
  res.locals.queryOptions = { subQuery: false };

  return next(null, query);
}

module.exports = router;
