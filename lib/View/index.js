/**
 * wejs view feature
 */
var hbs = require('hbs');
var fs = require('fs');
var async = require('async');
var _ = require('lodash');

var View = function viewPrototype(we) {
  this.we = we;
  this.assets = require('./assets');
  // admin and app theme if avaible
  this.appTheme = null;
  this.adminTheme = null;
  // enabled themes list
  this.themes = {};

  // --forms feature
  this.forms = {};

  this.layoutCache = {};
  this.templateCache = {};
  // widget type instances
  this.widgets = {};

  this.configuration = {
    layouts: {},
    templates: {},
    helpers: {},
    // widgets lists with widget folder
    widgets: {}
  };
}

/**
 * Initialize we.view feature
 * @param  {Object} we we.js
 */
View.prototype.initialize = function initialize(we) {
  this.getWe = function getWe(){ return we };
  var view = this;

  we.hbs = hbs;

  // set view middleware for every request
  we.events.on('router:before:set:controller:middleware', function (data) {
    data.middlewares.push(view.middleware.bind(data.config));
  });

  // set default themes vars
  we.events.on('we:after:load:plugins', function (we) {
    var themesConfig = we.config.themes;
    var name;

    // load all themes
    for (var i = 0; i < themesConfig.enabled.length; i++) {
      if (we.utils._.isString(themesConfig.enabled[i])) {
        name = themesConfig.enabled[i];

        view.themes[name] = new we.class.Theme(
          name, we.projectPath
        );
      } else {
        name = themesConfig.enabled[i].name;

        view.themes[name] = new we.class.Theme(
          name, we.projectPath, themesConfig.enabled[i]
        );
      }

      view.themes[name].projectThemeName = name;
    }

    view.appTheme = themesConfig.app;
    view.adminTheme = themesConfig.admin;
  });

  // change default missing helper log
  we.hbs.handlebars.helpers.helperMissing = view.helperMissing;
};

/**
 * Load templates from cache file?
 *
 * @return {Boolean}
 */
View.prototype.loadFromCache = function loadFromCache() {
  return this.we.config.loadTemplatesFromCache[this.we.env];
};

View.prototype.setExpressConfig = function setExpressConfig(express) {
  var view = this;

  express.use(function viewConfigMiddleware(req, res, next){
    res.renderPage = view.renderPage.bind({req: req, res: res});
    // default theme, is changed if are in admin area
    res.locals.theme = view.appTheme;
    // theme object getter
    res.getTheme = view.geTheme;

    // set default htmlTemplate file
    res.locals.htmlTemplate = 'html';

    if (req.query.skipHTML) res.locals.skipHTML = true;

    next();
  })
};

View.prototype.geTheme = function geTheme() {
  return this.req.we.view.themes[this.locals.theme];
};

View.prototype.middleware = function middleware(req, res, next) {
  var view = req.we.view;

  view.resolveLayout(req, res, function() {
    // set default layout name
    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    if (res.locals.skipWidgets) return next();
    // only work with html requests
    if (!req.accepts('html') || req.query.contentOnly) return next();

    var we = req.we;
    var theme = res.getTheme();

    if (!theme) return next();

    // set current layout regions
    if (!res.locals.regions) res.locals.regions = {};

    if (!theme.layouts[res.locals.layoutName]) {
      res.locals.layoutName = 'default';
    }

    var regions = Object.keys(theme.layouts[res.locals.layoutName].regions);
    for (var i = 0; i < regions.length; i++) {
      res.locals.regions[regions[i]] = { widgets: [] };
    }

    var where =  we.view.getDefaultWidgetQuery(req, res);

    if (res.locals.action != 'findOne') {
      where.inRecord = { $or: [false , null] };
    }

    // preload all widgets for this response
    we.db.models.widget.findAll({
      where: where,
      order: [
        ['weight', 'ASC'], ['createdAt', 'DESC']
      ],
    }).then(function (widgets) {
      async.each(widgets, function (widget, nextW) {
        // set widget
        res.locals.regions[widget.regionName].widgets.push(widget);
        // run view middleware for load widget view data
        we.log.verbose('widget.viewMiddleware:', widget.id, widget.type);
        widget.viewMiddleware(req, res, nextW);
      }, next);
    }).catch(next);
  });
};

View.prototype.getDefaultWidgetQuery = function getDefaultWidgetQuery(req, res) {
  var theme = res.getTheme();

  if (!res.locals.layoutName || !theme.layouts[res.locals.layoutName])
    res.locals.layoutName  = 'default';

  var regions = Object.keys(theme.layouts[res.locals.layoutName].regions);

  return {
    theme: { $or: [ res.locals.theme, null, ''] },
    layout: res.locals.layoutName,
    regionName: regions,
    context: res.locals.widgetContext || null,
    // path

    path: { $or: [req.path, null, '']},
    // widget visibility conditions
    $or: [
      // current session (model)
      {
        $and: [
          { modelName: res.locals.model || null },
          { modelId: null },
        ]
      },
      // global
      {
        $and: [
          { modelName: null },
          { modelId: null },
        ]
      },
      // current record
      {
        $and: [
          { modelName: res.locals.model || null },
          { modelId: res.locals.id || null },
        ]
      },
      // contents of this sesison
      {
        $and: [
          { modelName: res.locals.model || null },
          { modelId: null },
          { inRecord: true },
        ]
      }
    ]
  };
};

/**
 * Update widgets middleware, override default route action based in we-widget-action
 *
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
View.prototype.updateWidgetMiddleware = function updateWidgetMiddleware(req, res, next) {
  if (!req.isWidgetAction) return next();

  // redirect to widget controller if headers['we-widget-action'] is set:

  // check permisison
  //
  if (res.locals.widgetContext) {
    if(!req.we.acl.canStatic('create_context_widget', req.userRoleNames)) {
      return res.forbidden();
    }
  } else {
    if(!req.we.acl.canStatic('manage_widget', req.userRoleNames)) {
      return res.forbidden();
    }
  }

  if (req.headers['we-widget-action'] == 'add') {

    req.body = JSON.parse(req.body.widget);
    return req.we.controllers.widget.create(req, res);

  } else if (req.headers['we-widget-action'] == 'getUpdateForm') {

    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.params.id = req.body.id;
    return req.we.controllers.widget.getForm(req, res, next);

  } else if (req.headers['we-widget-action'] == 'update') {

    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.widgetId = req.body.id;
    return req.we.controllers.widget.edit(req, res);

  } else if (req.headers['we-widget-action'] == 'delete') {

    req.method = 'POST';
    req.widget = { id: req.body.widgetId };

    return req.we.db.models.widget.findById(req.widget.id)
    .then(function (w) {
      res.locals.data = w;
      req.we.controllers.widget.delete(req, res);
    }).catch(res.queryError);

  } else if (req.headers['we-widget-action'] == 'findOne') {

    req.widgetData = JSON.parse(req.body.widget);
    res.locals.id = req.widgetData.id;

    return req.we.db.models.widget
    .findOne({ where: { id: res.locals.id }})
    .then(function afterfindOneWidget(r) {
      if (!r) return res.notFound();
      res.locals.id = r.id;
      res.locals.data = r;
      return req.we.controllers.widget.findOne(req, res, next);
    }).catch(res.queryError);

  } else if (req.headers['we-widget-action'] == 'find') {

    res.locals.model = 'widget';
    return req.we.controllers.widget.find(req, res, next);

  } else if (req.headers['we-widget-action'] == 'getWidgetsToSort') {

    if (req.body.params) req.params = JSON.parse(req.body.params);
    return req.we.controllers.widget.sortWidgets(req, res);

  } else if (req.headers['we-widget-action'] == 'updateSort') {

    req.body.widgets = JSON.parse(req.body.widgets);
    if (req.body.params) req.params = JSON.parse(req.body.params);

    res.locals.regionName = req.params.regionName;

    req.method = 'POST';
    return req.we.controllers.widget.sortWidgets(req, res);

  } else {
    console.log('bad')
    return res.badRequest();
  }
};

View.prototype.registerAll = function registerAll() {
  this.registerHelpers(this.we);
  var themes = this.we.view.themes;

  // move all templates to we.view.configuration.templates
  var name, templateName;

  for (name in themes) {
    // skip if this theme dont have templates
    if (!themes[name].templates) continue;
    // for each template in theme ...
    for (templateName in themes[name].templates) {
      // add it in configuration.templates
      this.we.view.configuration.templates[name+'/'+templateName] = themes[name].templates[templateName];
    }
  }
};

View.prototype.registerHelpers = function registerHelpers(we) {
  for (var helperName in this.configuration.helpers) {
     hbs.registerHelper( helperName, require( this.configuration.helpers[helperName] )(we, this) );
  }
};

View.prototype.renderLayout = function renderLayout(req, res, data) {
  var template, theme = res.getTheme();
  var view = req.we.view;

  // render body afer render layout
  res.locals.body = view.renderBody(res);
  // unique name for current theme layout
  var layoutThemeName = res.locals.theme + '/' + res.locals.layoutName;

  if (view.loadFromCache()) {
    // load template from cache, by defalt only load for prod env
    template = view.layoutCache[layoutThemeName];
  } else {
    if (theme && theme.layouts[res.locals.layoutName]) {
      template = hbs.compile(fs.readFileSync(theme.layouts[res.locals.layoutName].template, 'utf8'));
    } else if (view.configuration.layouts[res.locals.layoutName]){
      template = hbs.compile(fs.readFileSync(view.configuration.layouts[res.locals.layoutName], 'utf8'));
    } else {
      template = hbs.compile(fs.readFileSync(view.configuration.layouts.default, 'utf8'));
    }
  }

  if (data) res.locals.data = data;
  if (res.locals.skipHTML) {
    return template(res.locals);
  } else {
    res.locals.layoutHtml = '<div id="we-layout" data-we-layout="'+
      res.locals.layoutName+'" data-we-widgetcontext="'+
      (res.locals.widgetContext || '')+'" >' +
      template(res.locals) +
    '</div>';
    return view.renderTemplate(res.locals.htmlTemplate, res.locals.theme, res.locals);
  }
};
/**
 * Render html body content
 * @param  {Object} res express response
 * @return {String}     html
 */
View.prototype.renderBody = function renderBody(res) {
  return this.renderTemplate(res.locals.template, res.locals.theme, res.locals);
};
/**
 * render one template, first check if the template exists in theme if now fallback to plugin tempalte
 * @param  {String} name      template name
 * @param  {String} themeName current theme name
 * @param  {Object} data      Data to send to template
 * @return {String}           compiled template html
 */
View.prototype.renderTemplate = function renderTemplate(name, themeName, data) {
  var view = this;
  var theme = view.themes[themeName];
  var template;

  // unique name for current theme template
  var templateThemeName = themeName + '/' + name;

  // check in theme cache if load from cache is set in configs, by default will load in prod env
  if (view.loadFromCache()) {
    if (view.templateCache[templateThemeName]) {
      // theme template
      return view.templateCache[templateThemeName](data);
    } else if (view.templateCache[name]) {
      // plugin template
      return view.templateCache[name](data);
    }
  }

  // resolve template and get it compiled
  template = View.prototype.getAndCompileTemplateToRenderSync(theme, view, templateThemeName, data, name);

  // template not found
  if (!template) {
    this.we.log.error('Template not found: ' + name + ' themeName: ' + themeName);
    return '';
  }

  // save in cache if not found ... this may ocurs for templates with fallback
  if (view.loadFromCache()) {
    // cache it if are prod env
    view.templateCache[templateThemeName] = template;
  }

  try {
    return template(data);
  } catch(e) {
    this.we.log.error('Error on render template: ',name, template, e);
    return '';
  }
};

/**
 * Get and compile templates from view templates configurations  or from data.fallbackTemplate
 */
View.prototype.getAndCompileTemplateToRenderSync =
function getAndCompileTemplateToRenderSync(theme, view, templateThemeName, data, name) {

  if (theme && view.configuration.templates[templateThemeName]) {
    // theme template
    return hbs.compile(fs.readFileSync(view.configuration.templates[templateThemeName], 'utf8'));
  } else if (view.configuration.templates[name]) {
    // plugin template
    return hbs.compile(fs.readFileSync(view.configuration.templates[name], 'utf8'));
  } else if (data && data.fallbackTemplate) {
    // fallback template
    return hbs.compile(fs.readFileSync(data.fallbackTemplate, 'utf8'));
  } else {
    return null;
  }
}

View.prototype.renderPage = function renderPage(req, res, data) {
  return req.we.view.renderLayout(req, res, data);
};

View.prototype.themeScriptTag = function themeScriptTag(src) {
  return '<script type="text/javascript" src="'+ src+this.assets.v+'"></script>';
};

View.prototype.themeStylesheetTag = function themeStylesheetTag(href) {
  return '<link href="'+ href+this.assets.v+'" rel="stylesheet" type="text/css">'
};

/**
 * Resolve layout for current request
 *
 * @param  {Object}   req  express.js request
 * @param  {Object}   res  express.js response
 * @param  {Function} next callback
 */
View.prototype.resolveLayout = function resolveLayout(req, res, next) {
  var theme = res.getTheme();

  if (!theme) return next();

  if (!res.locals.layoutName || res.locals.layoutName === 'default') {
    // first try to use the controller + - + modelName + -layout
    if (
      res.locals.controller &&
      res.locals.model &&
      theme.layouts[res.locals.controller+ '-' +res.locals.model+'-layout']
    ) {
      res.locals.layoutName = res.locals.controller+ '-' +res.locals.model+'-layout';

    // then use res.locals.model+'-layout'
    } else if (res.locals.model && theme.layouts && theme.layouts[res.locals.model+'-layout']) {
      res.locals.layoutName = res.locals.model+'-layout';
    // or set the default layout
    } else {
      res.locals.layoutName = 'default';
    }
  }

  next();
};

View.prototype.helperMissing = function helperMissing() {
  if (!this.we && !this.locals) return; // skip if not found we

  var we = this.we || this.locals.req.we;

  if (arguments.length > 1 || !_.isEmpty(arguments[0].hash) ) {
    if (we.env == 'prod') {
      we.log.verbose('Missing helper: ', arguments[arguments.length - 1].name);
    } else {
      we.log.warn('Missing helper: ', arguments[arguments.length - 1].name);
    }
  }
}

View.prototype.loadTemplatesFromCacheBuild = function loadTemplatesFromCacheBuild(we, cb) {
  var cache, name;

  try {
    cache = require(we.config.templatesCacheFile)(we);
  } catch(e) {
    return cb(e);
  }

  // compile and load all layouts
  for (name in cache.layouts) {
    we.view.layoutCache[name] = we.hbs.compile(cache.layouts[name], 'utf8');
  }

  // compile and load all templates
  for (name in cache.templates) {
    we.view.templateCache[name] = we.hbs.compile(cache.templates[name], 'utf8');
  }

  cb();
}

View.prototype.cacheAllTemplates = function cacheAllTemplates(we, cb) {
  if (!cb) cb = function(){};

  var cache = {
    layouts: {},
    templates: {}
  };

  var themes = we.view.themes;
  var themeNames = Object.keys(themes);


  we.utils.async.series([
    function loadAll (done){

      we.utils.async.each(themeNames, function eachTheme(themeName, next){
        var theme = themes[themeName];

        // layouts
        for (var layoutName in theme.layouts) {
          cache.layouts[themeName+'/'+layoutName] = fs.readFileSync(theme.layouts[layoutName].template, 'utf8');
        }

        // templates

        for (var templateName in we.view.configuration.templates) {
          // load the template
          cache.templates[templateName] = fs.readFileSync(we.view.configuration.templates[templateName], 'utf8');
        }

        next();
      }, done);
    }

  ], function doneAll(err) {
    if (err) return cb(err);

    var text = 'module.exports = function loadCachedTemplates (we){\n';
    text += 'return '+ JSON.stringify(cache, null, 2) + '\n';
    text += '\n};';

    fs.writeFile(we.config.templatesCacheFile, text, function afterSaveFile(err){
      if (err) return cb(err);

      cb();
    });
  });
}

module.exports = View;
