var _ = require('lodash');
var uploader = require('./uploader');
var weCorePath = require('path').resolve(__dirname, '../', '../');
var cors = require('cors');
var Alias = require('./Alias');
var mime = require('mime');
// absolute url regex tester
var absoluteUrlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');

var Router = function routerPrototype(we) {
  this.we = we;
  var router = this;

  this.routeMap = {};
  // resources tree
  this.resources = {};
  // resources salved by name
  this.resourcesByName = {};
  this.resourcesSort = [];
  this.search = require('./search');
  this.title = require('./title');
  this.alias = new Alias(we);
  this.metatag = require('./metatag');
  this.breadcrumb = require('./breadcrumb');

  router.singleRecordActions = [
    'findOne', 'update', 'destroy', 'updateAttribute',
    'deleteAttribute', 'addRecord', 'removeRecord', 'getRecord', 'edit', 'delete'
  ];

  we.hooks.on('we:router:request:after:load:context', [
    function runTitleMiddleware(data, done) {
      // only run on html response
      if (!data.req.accepts('html')) return done();
      router.title.middleware(data.req, data.res, done);
    },
    function runMetatagMiddleware(data, done) {
      // only run on html response
      if (!data.req.accepts('html')) return done();
      router.metatag.middleware(data.req, data.res, done);
    },
    function runBreadcrumbMiddleware(data, done) {
      // only run on html response
      if (!data.req.accepts('html')) return done();
      router.breadcrumb.middleware(data.req, data.res, done);
    }
  ]);
}

/**
 * Bind one we.js route
 *
 * This function bind context loader, acl, upload and controller middlewares
 *
 * @param  {Object} we     we.js object
 * @param  {String} route  route like "get /route"
 * @param  {Object} config route configs
 */
Router.prototype.bindRoute = function bindRoute (app, route, config, groupRouter){
  var method, path;

  // set responseType based in extension
  var extension = app.router.splitExtensionFromURL(route);
  if (extension) {
    config.responseType = extension;
    // update route for allow accesss without extension
    route = route.replace('.' + extension, '');
  }

  // parse method and url
  var r = route.split(' ');
  if (r.length > 1) {
    method = r[0];
    path = r[1];
  } else {
    method = 'get';
    path = r[0];
  }

  if (config.method) method = config.method;

  var actionFunction = '';
  // search for the controller action to bind
  if (
    app.controllers[config.controller] &&
    app.controllers[config.controller][config.action]
  ) {
    actionFunction = app.controllers[config.controller][config.action];
  } else {
    return app.log.warn('app.router.bindRoute: Unknow controller or action:', path, config);
  }

  if (!groupRouter) groupRouter = app.express;

  if (config.search) {
    // save param names
    config.searchParams = Object.keys(config.search);
  }

  var middlewares = [
    // CORS middleware per route
    cors( (config.CORS || app.config.security.CORS) ),
    // body we.js parser
    app.router.parseBody.bind({ config: config }),
    // bind context loader
    app.router.contextLoader.bind({ config: config }),
    // bind acl middleware
    app.acl.canMiddleware.bind({ config: config }),
    // bind update widget middleware
    app.view.updateWidgetMiddleware.bind({ config: config }),
  ];

  /**
   * Use this event to change we.js route middlewares
   * @type {Event}
   */
  app.events.emit('router:add:acl:middleware', {
    we: app, middlewares: middlewares, config: config
  });

  // bind upload  if have upload config and after ACL check
  if (config.upload)
    middlewares.push(uploader(config.upload));

  /**
   * Use this event to change we.js route middlewares
   * @type {Event}
   */
  app.events.emit('router:before:set:controller:middleware', {we: app, middlewares: middlewares, config: config});
  // bind contoller
  middlewares.push(actionFunction);

  groupRouter[method](path, middlewares);

  var mapName = config.name;
  if (!mapName)
    mapName = config.controller + '.' + config.action;

  if (!app.router.routeMap[method]) app.router.routeMap[method] = {};

  // map get routes for use with link-to
  app.router.routeMap[method][mapName] = {
    map: app.router.parseRouteToMap(path),
    config: config
  };

  app.log.silly('Route bind:', method ,path);
}

/**
 * Set resource, findAll, find, create, edit and delete routes
 *
 * @param  {Object} opts  route options
 * @todo make it simpler
 */
Router.prototype.bindResource = function bindResource(opts) {
  var we = this.we;
  var router = this;

  // valid route options ...
  if (!opts.name) throw new Error('Resource name is required in bind resource');
  // get related Model
  var Model = we.db.models[opts.name];

  if (!Model) throw new Error('Resource Model not found and is required in bind resource');
  // set default options
  _.defaults(opts, {
    tplFolder: weCorePath + '/server/templates/',
    routeId: ':'+ opts.name +'Id',
    namePrefix: '',
    templateFolderPrefix: '',
    itemTitleHandler: 'i18n',
    rootRoute: '/' + opts.name
  });

  if (opts.namespace) opts.rootRoute = opts.namespace + opts.rootRoute;

  if (opts.parent) {
    if (!router.resourcesByName[opts.parent]) {
      throw new Error('Parent route not found: '+opts.parent+' <- '+ opts.name);
    }

    if (router.resourcesByName[opts.parent].itemRoute) {
      opts.rootRoute = router.resourcesByName[opts.parent].itemRoute + opts.rootRoute;
    } else {
      opts.rootRoute = router.resourcesByName[opts.parent].itemRoute + opts.rootRoute;
    }
  }

  if (!opts.itemRoute) opts.itemRoute = opts.rootRoute+'/'+opts.routeId;

  var cfg = {
    controller: ( opts.controller || opts.name ),
    model: ( opts.model || opts.name )
  };

  if (Model.options.titleField) opts.itemTitleHandler = 'recordField';

  // run all route resources bindders in router.resrouce
  // this allows plugins to extend with extra resource paths
  for(var r in router.resourceBinder) {
    router.resourceBinder[r](we, cfg, opts, Model);
  }
  // set crud permissions
  ['find', 'create', 'update', 'delete'].forEach(function(ai){
    if (!we.config.permissions[ai+'_'+cfg.model]) {
      we.config.permissions[ai+'_'+cfg.model] = {
        'title': ai+'_'+cfg.model
      }
    }
  });

  // after bind this resource routes, bind subRoutes
  router.bindSubRouteResources(opts, we);
}

Router.prototype.bindSubRouteResources = function bindSubRouteResources(opts, we) {
  if (opts.subRoutes) {
    for (var resource in opts.subRoutes) {
      we.router.bindResource(opts.subRoutes[resource]);
    }
  }
}

// variable to add resource bindders
Router.prototype.resourceBinder = {};

/**
 * Bind resrouce create routes
 *
 * @param  {Object} we
 * @param  {Object} cfg
 * @param  {Object} opts
 * @param  {Object} Model
 */
Router.prototype.resourceBinder.bindCreateResource = function bindCreateResource(we, cfg, opts) {
  // save get create page
  we.routes['get '+opts.rootRoute+'/create'] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      layoutName: opts.layoutName, // null = default layout
      name: opts.namePrefix + opts.name + '.create',
      action: 'create',
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/create',
      fallbackTemplate: opts.tplFolder + 'default/create.hbs',
      permission: 'create_' + opts.name,
      titleHandler: 'i18n',
      titleI18n: opts.name + '.create',
      breadcrumbHandler: 'create'
    },
    opts.create,
    we.routes['get '+opts.rootRoute+'/create'] || {}
  );

  // set post create page
  we.routes['post '+opts.rootRoute+'/create'] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      layoutName: opts.layoutName, // null = default layout
      action: 'create',
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/create',
      fallbackTemplate: opts.tplFolder + 'default/create.hbs',
      permission: 'create_' + opts.name,
      titleHandler: 'i18n',
      titleI18n: opts.name + '.create',
      breadcrumbHandler: 'create'
    },
    opts.create,
    we.routes['post '+opts.rootRoute+'/create'] || {}
  );

  // set post create on list for APIS
  we.routes['post '+opts.rootRoute] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      action: 'create',
      controller: cfg.controller,
      model: cfg.model,
      permission: 'create_' + opts.name,
      breadcrumbHandler: 'create'
    },
    opts.create,
    we.routes['post '+opts.rootRoute] || {}
  );
}

/**
 * Bind resource find routes
 *
 * @param  {Object} we
 * @param  {Object} cfg
 * @param  {Object} opts
 * @param  {Object} Model
 */
Router.prototype.resourceBinder.bindGetResource = function bindGetResource(we, cfg, opts, Model) {
  // set findAll

  we.routes['get ' + opts.rootRoute] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      layoutName: opts.layoutName, // null = default layout
      name: opts.namePrefix + opts.name + '.find',
      action: 'find',
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/find',
      fallbackTemplate: opts.tplFolder + 'default/find.hbs',
      permission: 'find_' + opts.name,
      titleHandler: 'i18n',
      titleI18n: opts.name + '.find',
      routeQuery: opts.routeQuery,
      // default search
      search: {
        // since search is avaible in findAll by default
        since: {
          parser: 'since',
          target: {
            type: 'field',
            field: 'createdAt'
          }
        }
      },
      breadcrumbHandler: 'find'
    },
    opts.findAll,
    we.routes['get ' + opts.rootRoute] || {}
  );

  // set findOne
  we.routes['get '+opts.itemRoute] = _.merge(
    {
      layoutName: opts.layoutName, // null = default layout
      resourceName: opts.namePrefix+opts.name,
      name: opts.namePrefix + opts.name + '.findOne',
      action: 'findOne',
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/findOne',
      fallbackTemplate: opts.tplFolder + 'default/findOne.hbs',
      permission: 'find_' + opts.name,
      titleHandler: opts.itemTitleHandler,
      titleField: Model.options.titleField,
      titleI18n: opts.name + '.findOne',
      breadcrumbHandler: 'findOne'
    },
    opts.findOne,
    we.routes['get '+opts.itemRoute] || {}
  );
}

/**
 * Bind resource update routes
 *
 * @param  {Object} we
 * @param  {Object} cfg
 * @param  {Object} opts
 * @param  {Object} Model
 */
Router.prototype.resourceBinder.bindUpdateResource = function bindUpdateResource(we, cfg, opts, Model) {

  // set get edit page
  we.routes['get '+opts.itemRoute+'/edit'] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      name: opts.namePrefix + opts.name + '.edit',
      layoutName: opts.layoutName, // null = default layout
      action: 'edit',
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/edit',
      fallbackTemplate: opts.tplFolder + 'default/edit.hbs',
      permission: 'update_' + opts.name,
      titleHandler: opts.itemTitleHandler,
      titleField: Model.options.titleField,
      titleI18n: opts.name + '.edit',
      breadcrumbHandler: 'edit'
    },
    opts.edit,
    we.routes['get '+opts.itemRoute+'/edit'] || {}
  );

  // set post edit page
  we.routes['post '+opts.itemRoute+'/edit'] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      action: 'edit',
      layoutName: opts.layoutName, // null = default layout
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/edit',
      fallbackTemplate: opts.tplFolder + 'default/edit.hbs',
      permission: 'update_' + opts.name,
      titleHandler: opts.itemTitleHandler,
      titleField: Model.options.titleField,
      titleI18n: opts.name + '.edit',
      breadcrumbHandler: 'edit'
    },
    opts.edit,
    we.routes['post '+opts.itemRoute+'/edit'] || {}
  );

  // set put update for APIS
  we.routes['put '+opts.itemRoute] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      action: 'edit',
      controller: cfg.controller,
      model: cfg.model,
      permission: 'update_' + opts.name
    },
    opts.edit,
    we.routes['put '+opts.itemRoute] || {}
  );

  // set patch update for APIS
  we.routes['patch '+opts.itemRoute] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      action: 'edit',
      controller: cfg.controller,
      model: cfg.model,
      permission: 'update_' + opts.name
    },
    opts.edit,
    we.routes['patch '+opts.itemRoute] || {}
  );
}

/**
 * Bind resource delete routes
 *
 * @param  {Object} we
 * @param  {Object} cfg
 * @param  {Object} opts
 * @param  {Object} Model
 */
Router.prototype.resourceBinder.bindDeleteResource = function bindDeleteResource(we, cfg, opts, Model) {

  // set get delete page
  we.routes['get '+opts.itemRoute+'/delete'] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      name: opts.namePrefix + opts.name + '.delete',
      action: 'delete',
      layoutName: opts.layoutName, // null = default layout
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/delete',
      fallbackTemplate: opts.tplFolder + 'default/delete.hbs',
      permission: 'delete_' + opts.name,
      titleHandler: opts.itemTitleHandler,
      titleField: Model.options.titleField,
      titleI18n: opts.name + '.delete',
      breadcrumbHandler: 'delete'
    },
    opts.delete,
    we.routes['get '+opts.itemRoute+'/delete'] || {}
  );

  // set post delete page
  we.routes['post '+opts.itemRoute+'/delete'] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      action: 'delete',
      layoutName: opts.layoutName, // null = default layout
      controller: cfg.controller,
      model: cfg.model,
      template: opts.templateFolderPrefix + opts.name + '/delete',
      fallbackTemplate:  opts.tplFolder + 'default/delete.hbs',
      permission: 'delete_' + opts.name,
      titleHandler: opts.itemTitleHandler,
      titleField: Model.options.titleField,
      titleI18n: opts.name + '.delete',
      breadcrumbHandler: 'delete'
    },
    opts.delete,
    we.routes['post '+opts.itemRoute+'/delete'] || {}
  );

  // bind delete for APIS
  we.routes['delete '+opts.itemRoute] = _.merge(
    {
      resourceName: opts.namePrefix+opts.name,
      action: 'delete',
      controller: cfg.controller,
      model: cfg.model,
      permission: 'delete_' + opts.name
    },
    opts.delete,
    we.routes['delete '+opts.itemRoute] || {}
  );
}

/**
 * Check if one url is absolute or relative
 *
 * @param  {String}  str url to check
 * @return {Boolean}     Returns true for absolute and false to relative
 */
Router.prototype.isAbsoluteUrl = function isAbsoluteUrl(str) {
  return absoluteUrlRegex.test(str);
}

/**
 * Parse route url to map
 * Identify route params
 *
 * @param  {String} route
 * @return {Array}
 */
Router.prototype.parseRouteToMap = function parseRouteToMap(route) {
  return route.split('/').map(function(r, i){
    if(r[0] === ':'){
      return { name: r, i: i };
    } else {
      return r;
    }
  });
}

/**
 * Url builder function helper, converts one route name to url
 *
 * @param  {String} name   route name
 * @param  {Array} params  array of params for use to build the route
 * @return {String}        Route url or path
 */
Router.prototype.urlTo = function urlTo (name, params){
  var we = this.we;

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
    we.log.verbose('Route map not found for urlTo: ' + name);
  }

  if (route.map && route.map.length && !url) url = '/';
  return url;
}

/**
 * Return a path url for given model record
 *
 * @param  {String} modelName record model name
 * @param  {Object} record    record
 * @return {String}           the path
 */
Router.prototype.pathToModel = function pathToModel(record) {
  return record.urlPath();
}

/**
 * Context loader middleware, run after others router middleware
 * and preload related record data for use in acl and controller
 */
Router.prototype.contextLoader = function contextLoader(req, res, next) {
  var router = req.we.router;
  var hooks = req.we.hooks;

  // only load context one time per request
  if (req.weContextLoaded) return next();
  // save current user reference for use in template
  res.locals.currentUser = req.user;
  // get route configs
  var config = this.config;
  // merge context var with route configs
  _.merge(res.locals, config);
  // save all params values as array for router.urlTo
  req.paramsArray = _.toArray(req.params);
  // set accept headers based in config.responseType, this overrides req.query.responseType
  if (config.responseType) req.headers.accept = mime.lookup(config.responseType);

  hooks.trigger('we:router:request:before:load:context', {
    req: req, res: res
  }, function runTheContextLoader(err) {
    if (err) return res.serverError(err);
    // set redirectTo
    res.locals.redirectTo = req.we.utils.getRedirectUrl(req, res);

    router.parseQuery(req, res, function(err, query) {
      res.locals.query = query;
      // skip record load if dont find model config
      if (!res.locals.model ) {
        return router.contextLoaded.bind({
          req: req, res: res, next: next, hooks: hooks
        })();
      }
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
          return router.contextLoaded.bind({
            req: req, res: res, next: next, hooks: hooks
          })(err);
        });
      } else {
        return router.contextLoaded.bind({
          req: req, res: res, next: next, hooks: hooks
        })();
      }
    });
  });
}

/**
 * contextLoaded , function how runs after contextLoader
 * @param  {Object} err if context loader returns error
 */
Router.prototype.contextLoaded = function contextLoaded(err) {
  this.req.weContextLoaded = true;
  if (err) return this.next(err);

  // router.resourceCacheMiddleware(req, res, function() {
  this.hooks.trigger('we:router:request:after:load:context', {
    req: this.req, res: this.res
  }, function afterRunAfterLoadContextHook(err) {
    if (err) return this.res.serverError(err);
    if (!this.req.user) return this.next();
    // preload user roles
    return this.req.user.getRoles()
    .then(function afterGetUserRoles(result) {
      this.next(null, result);
    }.bind(this));
  }.bind(this));
  // });
}

/**
 * Check resource cache
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
Router.prototype.resourceCacheMiddleware = function resourceCacheMiddleware(req, res, next) {
  // check modified cache
  if (
    !req.we.config.cache.skipResourceCache &&
    req.we.config.cache.resourceCacheActions.indexOf(res.locals.action) > -1 &&
    res.locals.data &&
    res.locals.data.updatedAt
  ) {
    if (req.header('If-Modified-Since') == res.locals.data.updatedAt.toUTCString()) {
      // if not modified, return a 304 with empty response
      return res.status(304).end();
    } else {
      res.setHeader('Last-Modified', res.locals.data.updatedAt.toUTCString());
    }
  }

  next();
};

/**
 * Add one route after 404 middleware for bind routes without
 * server restart
 */
Router.prototype.liveBindRoute = function bindRoute(we, route, config) {
  var allRoutes = we.express._router.stack;
  we.router.bindRoute(we, route, config);
  // push this new route to after 404 and error middlewares
  allRoutes.splice(allRoutes.length-3, 0, allRoutes.splice(allRoutes.length-1, 1)[0]);
}

/**
 * Check if need to load current model
 *
 * @param  {Object} req express request
 * @param  {Object} res express response
 * @return {Boolean}
 */
Router.prototype.needLoadCurrentModel = function needLoadCurrentModel(req, res) {
  if (res.locals.loadRecord === false) return false;
  if (res.locals.loadRecord === true) return true;

  if (!res.locals.action) return false;

  if ( this.singleRecordActions.indexOf( res.locals.action ) >-1 ) {
    return true;
  }
}

/**
 * Parse req.query for current request
 *
 * @param  {Object} req express request
 * @param  {Object} res express response
 * @param  {Function} next Callback
 */
Router.prototype.parseQuery = function parseQuery(req, res, next) {
  var we = req.we;
  var query = {
    // set subQuery to false by default
    subQuery: false,
    where: {}
  };

  if (res.locals.skipParseQuery) return next(null, query);

  // resolve query limit and offset
  if (res.locals.query && res.locals.query.limit) {
    // this allows to set query.limit in routes
    query.limit = res.locals.query.limit;
  } else if (req.query.limit) {
    if (req.query.limit < we.config.queryMaxLimit) {
      query.limit = req.query.limit;
    } else {
      query.limit = we.config.queryMaxLimit;
    }
  } else {
    query.limit = we.config.queryDefaultLimit;
  }

  query.limit = Number(query.limit);

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
    query.order = [['createdAt', 'DESC']];
  }
  // set default query include
  // query.include = [{ all: true, required: false}];
  this.addRequestNx1Assocs(req, res, query);
  // query where ex req.query.where
  if (req.we.config.enableQueryWhere) this.parseQueryWhere(req, res, query);
  // we.js query search route config
  this.parseQuerySearch(req, res, query);

  return next(null, query);
}

/**
 * Parse request query where
 *
 * @param  {Object} req   express.js request
 * @param  {Object} res   express.js response
 * @param  {Object} query query object to save results
 */
Router.prototype.parseQueryWhere = function parseQueryWhere(req, res, query) {
  // parse where
  try {
    if (req.query.where) query.where = JSON.parse( req.query.where );
  } catch(e) {
    req.we.log.warn('req.query.where have a invalid format', req.query.where);
    return res.badRequest();
  }
  // override url query with router query
  if (res.locals.routeQuery) _.merge(query.where, res.locals.routeQuery);
  // parse associations
  if (res.locals.model && req.we.db.models[res.locals.model]) {
    if (req.we.db.models[res.locals.model].associations) {
      var assocFields = Object.keys(req.we.db.models[res.locals.model].associations);
      var identifier;
      for (var i = assocFields.length - 1; i >= 0; i--) {
        identifier = req.we.db.models[res.locals.model].associations[assocFields[i]].identifier;
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
}

/**
 * Parse request query search
 *
 * @param  {Object} req   express.js request
 * @param  {Object} res   express.js response
 * @param  {Object} query query object to save results
 */
Router.prototype.parseQuerySearch = function parseQuerySearch(req, res, query) {
  // parse query search
  if (res.locals.search) {
    for (var sName in res.locals.search) {
      if (req.query[sName] || res.locals.search[sName].runIfNull) {
        this.search.targets[res.locals.search[sName].target.type](
          sName, res.locals.search[sName], req.query[sName], query, req, res
        )
      }
    }
  }
}

/**
 * Parse body requests
 *
 * @param  {Object}   req  express request
 * @param  {Object}   res  express response
 * @param  {Function} next callback
 */
Router.prototype.parseBody = function parseBody(req ,res, next) {
  if (req.we.config.updateMethods.indexOf(req.method) >-1 ) {
    for(var p in req.body) {
      if (req.body[p] === '' ) {
        // change empty string body params to null
        req.body[p] = null;
      } else if (req.body[p] === 'false' ) {
        // change false strings to boolean false value
        req.body[p] = false;
      }
    }

    if (req.body.setAlias) {
      // check if can model setAlias
      if (!req.we.acl.canStatic('setAlias', req.userRoleNames)) {
        delete req.body.setAlias;
      }
    }
  }

  next();
}

/**
 * Add request N x 1 associations in current request query.include for use in query

 * @param {Object} req   express.js request
 * @param {Object} res   express.js response
 */
Router.prototype.addRequestNx1Assocs = function addRequestNx1Assocs(req, res, query) {
  if (
    res.locals.model &&
    req.we.db.modelsConfigs[res.locals.model] &&
    req.we.db.modelsConfigs[res.locals.model].associations
  ) {
    query.include = [];

    var assocs = req.we.db.modelsConfigs[res.locals.model].associations;

    for(var name in assocs) {
      if (assocs[name].type == 'belongsTo') {
        query.include.push({
          model: req.we.db.models[assocs[name].model],
          as: name,
          required: false
        })
      }
    }

    if (!query.include.length) delete query.include;
  }
}

/**
 * Helper function for get and split extension from url
 *
 * @param  {String} url
 * @return {String} extension or null
 */
Router.prototype.splitExtensionFromURL = function splitExtensionFromURL (url){

  var path = url.split('?')[0];

  var urlParts = path.split('/');
  // get file name and extension
  var nameAndExt = urlParts[urlParts.length-1].split('.');
  // this path dont have one extension
  if (nameAndExt.length < 2) return null;
  // get extension
  return nameAndExt[nameAndExt.length-1];
}

/**
 * Check if url is public folder url
 *
 * @param  {String}  url
 * @return {Boolean}
 */
Router.prototype.isPublicFolder = function isPublicFolder (url){
  return url.startsWith('/public');
}

module.exports = Router;