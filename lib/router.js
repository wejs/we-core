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
  } else if(config.action && we.defaultController[config.action] ) {
    actionFunction = we.defaultController[config.action];
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
  )

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
  // get route configs
  var config = this.config;
  // merge context var with route configs
  _.merge(res.locals, config);

  if (!res.locals.model ) return contextLoaded();
  var we = req.getWe();
  // set model class
  res.locals.Model = we.db.models[res.locals.model];

  res.locals.id = req.params.id;

  res.locals.loadCurrentRecord = router.needLoadCurrentModel(req, res);

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

}

router.bindShadownRoutes = function bindShadownRoutes(we, cb) {
  if (!we.db.models || !we.controllers) return cb();

  var modelNames = Object.keys(we.db.models);

  var shadownRoutesToBind = [];
  for (var i = modelNames.length - 1; i >= 0; i--) {
    if (router.haveShadownRoute(we,  modelNames[i])) {
      shadownRoutesToBind.push(modelNames[i]);
    }
  }

  shadownRoutesToBind.forEach(function(model) {
    // get / find
    router.bindShadownFindRoute(we, model);
    // post / create
    router.bindShadownCreateRoute(we, model);
    // get :id / findOne
    router.bindShadownFindOneRoute(we, model);
    // put / update
    router.bindShadownUpdateRoute(we, model);
    // delete / destroy
    router.bindShadownDeleteRoute(we, model);
  });

  cb();
}

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

module.exports = router;