const _ = require('lodash'),
      cors = require('cors'),
      S = require('string'),
      mime = require('mime'),
      pluralize = require('pluralize'),
      // absolute url regex tester
      absoluteUrlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');
/**
 * Router protorype
 *
 * @param {Object} we
 */
function Router (we) {
  this.we = we;
  let router = this;

  this.publicRouter = null;

  this.routeMap = {};
  // resources tree
  this.resources = {};
  // resources salved by name
  this.resourcesByName = {};
  this.resourcesSort = [];
  this.search = require('./search');

  router.singleRecordActions = [
    'findOne', 'update', 'destroy', 'updateAttribute',
    'deleteAttribute', 'addRecord', 'removeRecord', 'getRecord', 'edit', 'delete'
  ];

  we.events.emit('we:Router:construct', this);
}

Router.prototype = {
  /**
   * Bind one we.js route
   *
   * This function bind context loader, acl, upload and controller middlewares
   *
   * @param  {Object} we     we.js object
   * @param  {String} route  route like "get /route"
   * @param  {Object} config route configs
   */
  bindRoute(app, route, config, groupRouter) {
    let method, path;

    if (!config) {
      // is route configuration is false or null, this route will be disabled
      app.log.verbose('route disabled:', route);
      return;
    }

    // set responseType based in extension
    let extension = app.router.splitExtensionFromURL(route);
    if (extension) {
      // check if is valid this extension and is one of acceptable extensions
      if (app.config.responseTypes.indexOf(extension) >-1) {
        config.responseType = extension;
        // update route for allow accesss without extension
        route = route.replace('.' + extension, '');
      } else {
        extension = null;
      }
    }

    // parse method and url
    let r = route.split(' ');
    if (r.length > 1) {
      method = r[0];
      path = r[1];
    } else {
      method = 'get';
      path = r[0];
    }

    if (config.method) method = config.method;

    let actionFunction = '';
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

    const middlewares = [
      // CORS middleware per route
      cors( (config.CORS || app.config.security.CORS) )
    ];

    /**
     * Use this event to set middlewares after CORS MD
     * @type {Event}
     */
    app.events.emit('router:route:after:cors:middleware', {
      we: app, middlewares: middlewares, config: config
    });

    // body we.js parser
    middlewares.push(app.router.parseBody.bind({ config: config }));
      // bind context loader
    middlewares.push(app.router.contextLoader.bind({ config: config }));

    /**
     * Use this event to add acl related middlewares
     * @type {Event}
     */
    app.events.emit('router:add:acl:middleware', {
      we: app, middlewares: middlewares, config: config
    });

    /**
     * Use this event to change we.js route middlewares
     * @type {Event}
     */
    app.events.emit('router:before:set:controller:middleware', {we: app, middlewares: middlewares, config: config});
    // bind contoller
    middlewares.push(actionFunction);

    groupRouter[method](path, middlewares);

    let mapName = config.name;
    if (!mapName)
      mapName = config.controller + '.' + config.action;

    if (!app.router.routeMap[method]) app.router.routeMap[method] = {};

    // map get routes for use with link-to
    app.router.routeMap[method][mapName] = {
      map: app.router.parseRouteToMap(path),
      config: config
    };

    app.log.silly('Route bind:', method, path);
  },

  /**
   * Set resource, findAll, find, create, edit and delete routes
   *
   * @param  {Object} opts  route options
   * @todo make it simpler
   */
  bindResource(opts) {
    // valid route options ...
    if (!opts.name) throw new Error('Resource name is required in bind resource');

    let we = this.we,
        paramIdNamePrefix = S(opts.name).camelize().s,
        pluralizedName = pluralize.plural(opts.name),
        router = this;

    // get related Model
    let Model = we.db.models[opts.name];

    if (!Model) throw new Error('Resource Model '+opts.name+' not found and is required in bind resource');
    // set default options
    _.defaults(opts, {
      pluralizedName: pluralizedName,
      paramIdName: paramIdNamePrefix+'Id',
      routeId: ':'+ paramIdNamePrefix +(opts.idFormat || 'Id([0-9]+)'),
      namePrefix: '',
      templateFolderPrefix: '',
      itemTitleHandler: 'i18n',
      rootRoute: '/' + ((we.config.router.pluralize)? pluralizedName: opts.name)
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

    let cfg = {
      controller: ( opts.controller || opts.name ),
      model: ( opts.model || opts.name )
    };

    if (Model.options.titleField) opts.itemTitleHandler = 'recordField';

    we.events.emit('we-core:before:bind:one:resource:route', {
      options: opts,
      configuration: cfg,
      we: we
    });

    // run all route resources bindders in router.resource
    // this allows plugins to extend with extra resource paths
    for (let r in we.config.resourceRoutes) {
      we.config.resourceRoutes[r](we, cfg, opts, Model);
    }

    // after bind this resource routes, bind subRoutes
    router.bindSubRouteResources(opts, we);
  },

  /**
   * Bind sub route resources
   *
   * This function allows routes like /org/:id/members
   *
   * @param  {Object} opts
   * @param  {Object} we   Current we.js app
   */
  bindSubRouteResources(opts, we) {
    if (opts.subRoutes) {
      for (let resource in opts.subRoutes) {
        we.router.bindResource(opts.subRoutes[resource]);
      }
    }
  },

  /**
   * Check if one url is absolute or relative
   *
   * @param  {String}  str url to check
   * @return {Boolean}     Returns true for absolute and false to relative
   */
  isAbsoluteUrl(str) {
    return absoluteUrlRegex.test(str);
  },

  /**
   * Parse route url to map
   * Identify route params
   *
   * @param  {String} route
   * @return {Array}
   */
  parseRouteToMap(route) {
    return route.split('/').map(function(r, i){
      if(r[0] === ':'){
        return { name: r, i: i };
      } else {
        return r;
      }
    });
  },

  /**
   * Url builder function helper, converts one route name to url
   *
   * @param  {String} name   route name
   * @param  {Array} params  array of params for use to build the route
   * @return {String}        Route url or path
   */
  urlTo(name, params) {
    const we = this.we;

    let url = '',
      route = {};

    if (
      we.router.routeMap.get &&
      we.router.routeMap.get[name]
    ) {
      route = we.router.routeMap.get[name];
      let mapI = 0;
      for (let i = 0; i < route.map.length; i++) {
        // skip empty path parts linke  // and fist /
        if (!route.map[i]) continue;
        if (typeof route.map[i] == 'string') {
          url += '/' + route.map[i];
        } else if (params && params[mapI]){
          url += '/' + params[mapI];
          mapI++;
        } else {
          we.log.warn('Invalid or undefined argument: ' + params +' ', route.map[i],'>', {
            paramsMapI: params[mapI],
            mapI: mapI,
            name: name
          });
        }
      }
    } else {
      we.log.verbose('Route map not found for urlTo: ', {
        name: name
      });
    }

    if (route.map && route.map.length && !url) url = '/';
    return url;
  },

  /**
   * Return a path url for given model record
   *
   * @param  {String} modelName record model name
   * @param  {Object} record    record
   * @return {String}           the path
   */
  pathToModel(record) {
    return record.urlPath();
  },

  /**
   * Context loader middleware, run after others router middleware
   * and preload related record data for use in acl and controller
   */
  contextLoader(req, res, next) {
    const router = req.we.router,
      hooks = req.we.hooks;

    // only load context one time per request even if context loader is recalled
    if (req.weContextLoaded) return next();
    // save current user reference for use in template
    res.locals.currentUser = req.user;
    // get route configs
    const config = this.config;
    // merge context var with route configs
    _.merge(res.locals, config);
    // save all params values as array for router.urlTo
    req.paramsArray = _.toArray(req.params);
    // set accept headers based in config.responseType, this overrides req.query.responseType
    if (config.responseType) req.headers.accept = mime.getType(config.responseType);

    hooks.trigger('we:router:request:before:load:context', {
      req: req, res: res
    }, function runTheContextLoader(err) {
      if (err) return res.serverError(err);
      // set redirectTo if not is set
      if (!res.locals.redirectTo) {
        res.locals.redirectTo = req.we.utils.getRedirectUrl(req, res);
      }

      router.parseQuery(req, res, (err, query)=> {
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
          if (req.params[res.locals.paramIdName]) {
            res.locals.id = req.params[res.locals.paramIdName];
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
  },

  /**
   * contextLoaded , function how runs after contextLoader
   * @param  {Object} err if context loader returns error
   */
  contextLoaded(err) {
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
      .nodeify(function afterGetUserRoles(err, result) {
        if (err) return this.res.queryError(err);

        this.next(null, result);
      }.bind(this));
    }.bind(this));
    // });
  },

  /**
   * Check resource cache
   * @param  {Object}   req  Express.js request
   * @param  {Object}   res  Express.js response
   * @param  {Function} next callback
   */
  resourceCacheMiddleware(req, res, next) {
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
  },

  /**
   * Add one route after 404 middleware for bind routes without
   * server restart
   */
  liveBindRoute(we, route, config) {
    const allRoutes = we.express._router.stack;
    we.router.bindRoute(we, route, config);
    // push this new route to after 404 and error middlewares
    allRoutes.splice(allRoutes.length-3, 0, allRoutes.splice(allRoutes.length-1, 1)[0]);
  },

  /**
   * Check if need to load current model
   *
   * @param  {Object} req express request
   * @param  {Object} res express response
   * @return {Boolean}
   */
  needLoadCurrentModel(req, res) {
    if (res.locals.loadRecord === false) return false;
    if (res.locals.loadRecord === true) return true;

    if (!res.locals.action) return false;

    if ( this.singleRecordActions.indexOf( res.locals.action ) >-1 ) {
      return true;
    }
  },

  /**
   * Parse req.query for current request
   *
   * @param  {Object} req express request
   * @param  {Object} res express response
   * @param  {Function} next Callback
   */
  parseQuery(req, res, next) {
    const we = req.we,
      query = {
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
      if (typeof req.query.order == 'string') {
        query.order = [req.query.order.split(' ')];
      } else {
        query.order = req.query.order;
      }

    } else if (req.query.sortDirection && req.query.sort) {
      query.order = [[req.query.sort, req.query.sortDirection]];
    } else if (req.query.sort) {
      query.order = req.query.sort;
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
  },

  /**
   * Parse request query where
   *
   * @param  {Object} req   express.js request
   * @param  {Object} res   express.js response
   * @param  {Object} query query object to save results
   */
  parseQueryWhere(req, res, query) {
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
        const assocFields = Object.keys(req.we.db.models[res.locals.model].associations);
        let identifier;
        for (let i = assocFields.length - 1; i >= 0; i--) {
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
  },

  /**
   * Parse request query search
   *
   * @param  {Object} req   express.js request
   * @param  {Object} res   express.js response
   * @param  {Object} query query object to save results
   */
  parseQuerySearch(req, res, query) {
    // parse query search
    if (res.locals.search) {
      for (let sName in res.locals.search) {
        if (req.query[sName] || res.locals.search[sName].runIfNull) {
          this.search.targets[res.locals.search[sName].target.type](
            sName, res.locals.search[sName], req.query[sName], query, req, res
          );
        }
      }
    }
  },

  /**
   * Parse body requests
   *
   * @param  {Object}   req  express request
   * @param  {Object}   res  express response
   * @param  {Function} next callback
   */
  parseBody(req ,res, next) {
    let parsers = req.we.responses.parsers;
    // add suport to parse body params if dont are in default json requests
    if (parsers[req.headers.accept]) {
      req.body = parsers[req.headers.accept](req, res, this) || {};
    }

    if (req.we.config.updateMethods.indexOf(req.method) >-1 ) {
      for (let p in req.body) {
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
  },

  /**
   * Add request N x 1 associations in current request query.include for use in query

   * @param {Object} req   express.js request
   * @param {Object} res   express.js response
   */
  addRequestNx1Assocs(req, res, query) {
    if (
      res.locals.model &&
      req.we.db.modelsConfigs[res.locals.model] &&
      req.we.db.modelsConfigs[res.locals.model].associations
    ) {
      query.include = [];

      const assocs = req.we.db.modelsConfigs[res.locals.model].associations;

      for(let name in assocs) {
        if (assocs[name].type == 'belongsTo') {
          query.include.push({
            model: req.we.db.models[assocs[name].model],
            as: name,
            required: false
          });
        }
      }

      if (!query.include.length) delete query.include;
    }
  },

  /**
   * Helper function for get and split extension from url
   *
   * @param  {String} url
   * @return {String} extension or null
   */
  splitExtensionFromURL(url) {
    const path = url.split('?')[0],
      urlParts = path.split('/'),
      // get file name and extension
      nameAndExt = urlParts[urlParts.length-1].split('.');

    // this path dont have one extension
    if (nameAndExt.length < 2) return null;
    // get extension
    return nameAndExt[nameAndExt.length-1];
  },

  /**
   * Check if url is public folder url
   *
   * @param  {String}  url
   * @return {Boolean}
   */
  isPublicFolder(url) {
    return url.startsWith('/public/') ||
           url == '/robots.txt' ||
           url == '/favicon.ico';
  }
};

module.exports = Router;