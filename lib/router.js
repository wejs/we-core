var _ = require('lodash');
var uploader = require('./middlewares/uploader');
var hooks = require('./hooks');
var weCorePath = require('path').resolve(__dirname, '../');

var router = {
  routeMap: {},
  resources: {},
  resourcesSort: []
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
router.bindRoute = function bindRoute(we, route, config, groupRouter) {
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

  if (!groupRouter) groupRouter = we.express;

  var middlewares = [
    // bind context loader
    router.contextLoader.bind({ config: config }),
    // bind acl middleware
    we.acl.canMiddleware.bind({ config: config })
  ];

  we.events.emit('router:add:acl:middleware', {
    we: we, middlewares: middlewares, config: config
  });

  // bind upload  if have config and after ACL check
  if (config.upload)
    middlewares.push(uploader(config.upload));

  we.events.emit('router:before:set:controller:middleware', {we: we, middlewares: middlewares, config: config});
  // bind contoller
  middlewares.push(actionFunction);

  groupRouter[method](path, middlewares);

  var mapName = config.name;
  if (!mapName)
    mapName = config.controller + '.' + config.action;

  if (!we.router.routeMap[method]) we.router.routeMap[method] = {};

  // map get routes for use with link-to
  we.router.routeMap[method][mapName] = {
    map: router.parseRouteToMap(path),
    config: config
  };

  we.log.silly('Route bind:', method ,path);
}

router.bindResource = function bindResource(opts) {
  var we = require('./index.js');
  var tplFolder = weCorePath + '/server/templates/';

  // valid route options ...
  if (!opts.name) throw new Error('Resource name is required in bind resource');

  var Model = we.db.models[opts.name];
  if (!Model) throw new Error('Resource Model not found and is required in bind resource');

  if (!opts.rootRoute) opts.rootRoute = '/' + opts.name;

  if (opts.namespace) opts.rootRoute = opts.namespace + opts.rootRoute;
  var namePrefix = ( opts.namePrefix || '');

  if (opts.parent) {
    if (!router.resources[opts.parent])
      throw new Error('Parent route not found in router.bindResource');

    opts.rootRoute = router.resources[opts.parent].itemRoute + opts.rootRoute;
  }

  var routeId = ':'+ opts.name +'Id';

  if (!opts.routeId) opts.routeId = routeId;
  if (!opts.itemRoute) opts.itemRoute = opts.rootRoute+'/'+routeId;

  var cfg = {
    controller: ( opts.controller || opts.name ),
    model: ( opts.model || opts.name )
  };

  var itemTitleHandler = 'i18n';
  if (Model.options.titleField) itemTitleHandler = 'recordField';

  var templateFolderPrefix = (opts.templateFolderPrefix || '');
  // bind findAll
  router.bindRoute(we, 'get ' + opts.rootRoute, {
    resourceName: namePrefix+opts.name,
    layoutName: (opts.findLayout || null),
    name: namePrefix + opts.name + '.find',
    action: 'find',
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/find',
    fallbackTemplate: tplFolder + 'default/find.hbs',
    permission: 'find_' + opts.name,
    titleHandler: 'i18n',
    titleI18n: opts.name + '.find',
    routeQuery: opts.routeQuery
  });
  // bind get create page
  router.bindRoute(we, 'get '+opts.rootRoute+'/create', {
    resourceName: namePrefix+opts.name,
    layoutName: (opts.createLayout || null),
    name: namePrefix + opts.name + '.create',
    action: 'create',
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/create',
    fallbackTemplate: tplFolder + 'default/create.hbs',
    permission: (opts.createPermission || 'create_' + opts.name),
    titleHandler: 'i18n',
    titleI18n: opts.name + '.create',
    routeQuery: opts.routeQuery
  });
  // bind post create page
  router.bindRoute(we, 'post '+opts.rootRoute+'/create', {
    resourceName: namePrefix+opts.name,
    layoutName: (opts.createLayout || null),
    action: 'create',
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/create',
    fallbackTemplate: tplFolder + 'default/create.hbs',
    permission: (opts.createPermission || 'create_' + opts.name),
    titleHandler: 'i18n',
    titleI18n: opts.name + '.create',
    routeQuery: opts.routeQuery
  });
  // bind findOne
  router.bindRoute(we, 'get '+opts.itemRoute, {
    layoutName: (opts.findOneLayout || null),
    resourceName: namePrefix+opts.name,
    name: namePrefix + opts.name + '.findOne',
    action: 'findOne',
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/findOne',
    fallbackTemplate: tplFolder + 'default/findOne.hbs',
    permission: 'find_' + opts.name,
    titleHandler: itemTitleHandler,
    titleField: Model.options.titleField,
    titleI18n: opts.name + '.findOne',
    routeQuery: opts.routeQuery
  });
  // bind get edit page
  router.bindRoute(we, 'get '+opts.itemRoute+'/edit', {
    resourceName: namePrefix+opts.name,
    name: namePrefix + opts.name + '.edit',
    layoutName: (opts.editLayout || null),
    action: 'edit',
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/edit',
    fallbackTemplate: tplFolder + 'default/edit.hbs',
    permission: (opts.editPermission || 'update_' + opts.name),
    titleHandler: itemTitleHandler,
    titleField: Model.options.titleField,
    titleI18n: opts.name + '.edit',
    routeQuery: opts.routeQuery
  });
  // bind post edit page
  router.bindRoute(we, 'post '+opts.itemRoute+'/edit', {
    resourceName: namePrefix+opts.name,
    action: 'edit',
    layoutName: (opts.editLayout || null),
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/edit',
    fallbackTemplate: tplFolder + 'default/edit.hbs',
    permission: (opts.editPermission || 'update_' + opts.name),
    titleHandler: itemTitleHandler,
    titleField: Model.options.titleField,
    titleI18n: opts.name + '.edit',
    routeQuery: opts.routeQuery
  });
  // bind get delete page
  router.bindRoute(we, 'get '+opts.itemRoute+'/delete', {
    resourceName: namePrefix+opts.name,
    name: namePrefix + opts.name + '.delete',
    action: 'delete',
    layoutName: (opts.deleteLayout || null),
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/delete',
    fallbackTemplate: tplFolder + 'default/delete.hbs',
    permission: (opts.deletePermission ||'delete_' + opts.name),
    titleHandler: itemTitleHandler,
    titleField: Model.options.titleField,
    titleI18n: opts.name + '.delete',
    routeQuery: opts.routeQuery
  });
  // bind post delete page
  router.bindRoute(we, 'post '+opts.itemRoute+'/delete', {
    resourceName: namePrefix+opts.name,
    action: 'delete',
    layoutName: (opts.deleteLayout || null),
    controller: cfg.controller,
    model: cfg.model,
    template: templateFolderPrefix + opts.name + '/delete',
    fallbackTemplate:  tplFolder + 'default/delete.hbs',
    permission: (opts.deletePermission || 'delete_' + opts.name),
    titleHandler: itemTitleHandler,
    titleField: Model.options.titleField,
    titleI18n: opts.name + '.delete',
    routeQuery: opts.routeQuery
  });

  // set crud permissions
  if (!we.config.permissions['find_'+cfg.model]) {
    we.config.permissions['find_'+cfg.model] = {
      'title': 'find_'+cfg.model
    }
  }
  if (!we.config.permissions['create_'+cfg.model]) {
    we.config.permissions['create_'+cfg.model] = {
      'title': 'create_'+cfg.model
    }
  }
  if (!we.config.permissions['update_'+cfg.model]) {
    we.config.permissions['update_'+cfg.model] = {
      'title': 'update_'+cfg.model
    }
  }
  if (!we.config.permissions['delete_'+cfg.model]) {
    we.config.permissions['delete_'+cfg.model] = {
      'title': 'delete_'+cfg.model
    }
  }
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

router.urlTo = function urlTo(name, params) {
  var we = require('./index');

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
        we.log.warn('Invalid or undefined argument: ' + params +' ', route.map[i],'>', params[mapI], mapI, name);
      }
    }
  } else {
    we.log.warn('Route map not found: ' + name);
  }

  if (route.map && route.map.length && !url) url = '/';
  return url;
}

/**
 * Context loader middleware, run after others router middleware
 * and preload related record data for use in acl and controller
 */
router.contextLoader = function contextLoader(req, res, next) {
  // only load context one time per request
  if (req.weContextLoaded) return next();
  // save current user reference for use in template
  res.locals.currentUser = req.user;
  // get route configs
  var config = this.config;
  // merge context var with route configs
  _.merge(res.locals, config);
  // save all params values as arrau for router.urlTo
  req.paramsArray = _.toArray(req.params);

  hooks.trigger('we:router:request:before:load:context', {
    req: req, res: res
  }, function (err) {
    if (err) return res.serverError(err);
    // set redirectTo
    var redirectTo = req.we.utils.getRedirectUrl(req, res);
    if (redirectTo) res.locals.redirectTo = redirectTo;

    router.parseQuery(req, res, function(err, query) {
      res.locals.query = query;
      // skip record load if dont find model config
      if (!res.locals.model ) return contextLoaded();
      // set model class
      res.locals.Model = req.we.db.models[res.locals.model];
      // set id if exists and not is set
      if (!res.locals.id) {
        if (req.params[res.locals.model + 'Id']) {
          res.locals.id = req.params[res.locals.model + 'Id'];
        } else if (req.params.id) {
          res.locals.id = req.params.id;
        }
      }
      // set teaserTemplateName
      res.locals.teaserTemplateName = res.locals.model + '/teaser';
      // set load current record flag for single records requests
      res.locals.loadCurrentRecord = router.needLoadCurrentModel(req, res);
      // default template
      if (!res.locals.template)
        res.locals.template = res.locals.model + '/' + res.locals.action;
      // run model context loader if exists
      if (
        req.we.db.models[res.locals.model] &&
        typeof req.we.db.models[res.locals.model].contextLoader == 'function'
      ) {
        req.we.db.models[res.locals.model].contextLoader(req, res, function afterRunModelContextLoader(err) {
          return contextLoaded(err);
        });
      } else {
        return contextLoaded();
      }

      function contextLoaded(err) {
        req.weContextLoaded = true;
        if (err) return next(err);
        // set user menu
        if (req.isAuthenticated()) {
          res.locals.userMenu = new req.we.class.Menu(
            req.we.config.menu.authenticatedUserMenu(req)
          );
        } else {
          res.locals.userMenu = new req.we.class.Menu(
            req.we.config.menu.unAuthenticatedUserMenu(req)
          );
        }
        // set admin menu
        res.locals.adminMenu = new req.we.class.Menu(
          req.we.config.menu.adminMenu(req)
        );

        hooks.trigger('we:router:request:after:load:context', {
          req: req, res: res
        }, function (err) {
          if (err) return res.serverError(err);
          if (!req.user) return next();
          // preload user roles
          return req.user.getRoles().then(function (result) {
            next(null, result);
          });
        });
      }
    });
  });
}

/**
 * We.js title middleware handlers
 */
router.title = {
  middleware: function titleMiddleware(data, next) {
    if (data.res.locals.titleHandler) {
      if (typeof data.res.locals.titleHandler === 'function') {
        return data.res.locals.titleHandler(data.req, data.res, next);
      } else if (router.title.middlewares[data.res.locals.titleHandler]) {
        return router.title.middlewares[data.res.locals.titleHandler](data.req, data.res, next);
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
      if (res.locals.record && res.locals.record) {
        if (res.locals.record.getDataValue) {
          res.locals.title = res.locals.record.get(res.locals.titleField);
        } else {
          res.locals.title = res.locals.record[res.locals.titleField];
        }
      }
      next();
    }
  }
}
hooks.on('we:router:request:after:load:context', router.title.middleware);

/**
 * Add one route after 404 middleware
 */
router.liveBindRoute = function bindRoute(we, route, config) {
  var allRoutes = we.express._router.stack;
  we.router.bindRoute(we, route, config);
  // push this new route to after 404 and error middlewares
  allRoutes.splice(allRoutes.length-3, 0, allRoutes.splice(allRoutes.length-1, 1)[0]);
}

router.singleRecordActions = [
  'findOne', 'update', 'destroy', 'updateAttribute',
  'deleteAttribute', 'addRecord', 'removeRecord', 'getRecord', 'edit', 'delete'
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

  if (res.locals.skipParseQuery) return next(null, query);

  if (req.query.limit) {
    if (req.query.limit < we.config.queryMaxLimit) {
      query.limit = req.query.limit;
    } else {
      query.limit = we.config.queryMaxLimit;
    }
  } else {
    query.limit = we.config.queryDefaultLimit;
  }

  if (req.query.page && Number(req.query.page) ) {
    query.offset = query.limit*(req.query.page-1);
    query.page = req.query.page;
  } else {
    query.offset = 0;
    query.page = 1;
  }

  if (req.query.order) {
    query.order = res.locals.model + '.' +req.query.order;
  } else if (req.query.sort) {
    query.order = res.locals.model + '.' +req.query.sort;
  } else {
    // default order
    query.order = 'createdAt DESC';
  }
  // set default query include
  query.include = [{ all: true, required: false}];
  // parse where
  try {
    if (req.query.where) query.where = JSON.parse( req.query.where );
  } catch(e) {
    we.log.warn('req.query.where have a invalid format', req.query.where);
    return res.badRequest();
  }
  // override url query with router query
  if (res.locals.routeQuery) _.merge(query.where, res.locals.routeQuery);
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
