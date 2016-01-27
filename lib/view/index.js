/**
 * wejs view feature
 */
var hbs = require('hbs');
var fs = require('fs');
var env = require('../env.js');
var Theme = require('../class/Theme.js');
var async = require('async');
var log = require('../log')();

var view = {
  assets: require('./assets'),
  // admin and app theme if avaible
  appTheme: null,
  adminTheme: null,
  // enabled themes list
  themes: {},


  layoutCache: {},
  templateCache: {},

  layouts: {},
  templates: {},
  helpers: {},
  widgets: {},

  configuration: {
    layouts: {},
    templates: {},
    helpers: {},
    widgets: {}
  },

  /**
   * Initialize we.view feature
   * @param  {Object} we we.js
   */
  initialize: function initialize(we) {
    view.getWe = function getWe(){ return we };

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

          view.themes[name] = new Theme(
            name, we.projectPath
          );
        } else {
          name = themesConfig.enabled[i].name;

          view.themes[name] = new Theme(
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
  },

  setExpressConfig: function setExpressConfig(express) {
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
  },

  geTheme: function geTheme() {
    return view.themes[this.locals.theme];
  },

  middleware: function middleware(req, res, next) {
    view.resolveLayout(req, res, function() {
      if (res.locals.skipWidgets) return next();
      // only work with html requests
      if (res.locals.responseType != 'html') return next();

      var we = req.we;
      var theme = res.getTheme();

      if (!theme) return next();

      // set current layout regions
      if (!res.locals.regions) res.locals.regions = {};
      // set default layout name
      if (!theme.layouts[res.locals.layoutName]) {
        res.locals.layoutName = 'default';
      }

      var regions = Object.keys(theme.layouts[res.locals.layoutName].regions);
      for (var i = 0; i < regions.length; i++) {
        res.locals.regions[regions[i]] = { widgets: [] };
      }

      var where =  {
        theme: res.locals.theme,
        layout: res.locals.layoutName,
        regionName: regions,
        context: res.locals.widgetContext || null,

        $or: {
          // url: req.url,
          modelName: { $or: [res.locals.model , null, '']},
          modelId: res.locals.id || null
        }
      };

      if (res.locals.action != 'findOne') {
        where.inRecord = { $or: [false , null] };
      }

      // preload all widgets for this response
      // TODO add a widgets memory cache
      we.db.models.widget.findAll({
        where: where,
        order: [
          ['weight', 'ASC'], ['createdAt', 'DESC']
        ]
      }).then(function (widgets) {
        async.each(widgets, function (widget, nextW) {
          // set widget
          res.locals.regions[widget.regionName].widgets.push(widget);
          // run view middleware for load widget view data
          widget.viewMiddleware(req, res, nextW);
        }, next);
      }).catch(next);
    });
  },

  registerAll: function registerAll() {
    var we = view.getWe();
    this.registerHelpers(we);
  },

  registerHelpers: function registerHelpers(we) {
    for (var helperName in view.configuration.helpers) {
       hbs.registerHelper( helperName, require( view.configuration.helpers[helperName] )(we, view) );
    }
  },

  renderLayout: function renderLayout(req, res, data) {
    var template, theme = res.getTheme();
    // render body afer render layout
    res.locals.body = view.renderBody(res);
    // unique name for current theme layout
    var layoutThemeName = res.locals.theme + '/' + res.locals.layoutName;

    if (env === 'prod' && view.layoutCache[layoutThemeName]) {
      // prod cache
      template = view.layoutCache[layoutThemeName];
    } else {
      if (theme && theme.layouts[res.locals.layoutName]) {
        template = hbs.compile(fs.readFileSync(theme.layouts[res.locals.layoutName].template, 'utf8'));
      } else if (view.configuration.layouts[res.locals.layoutName]){
        template = hbs.compile(fs.readFileSync(view.configuration.layouts[res.locals.layoutName], 'utf8'));
      } else {
        template = hbs.compile(fs.readFileSync(view.configuration.layouts.default, 'utf8'));
      }

      if (env === 'prod') {
        // cache it if are prod env
        view.layoutCache[layoutThemeName] = template;
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
  },
  /**
   * Render html body content
   * @param  {Object} res express response
   * @return {String}     html
   */
  renderBody: function renderBody(res) {
    return view.renderTemplate(res.locals.template, res.locals.theme, res.locals);
  },
  /**
   * render one template, first check if the template exists in theme if now fallback to plugin tempalte
   * @param  {String} name      template name
   * @param  {String} themeName current theme name
   * @param  {Object} data      Data to send to template
   * @return {String}           compiled template html
   */
  renderTemplate: function renderTemplate(name, themeName, data) {
    var theme = view.themes[themeName];
    var template;

    // unique name for current theme template
    var templateThemeName = themeName + '/' + name;
    // first check in cache
    if (env === 'prod' && view.templateCache[templateThemeName])
      return view.templateCache[templateThemeName](data);

    // resolve template
    if (theme && theme.templates[name]) {
      // theme template
      template = hbs.compile(fs.readFileSync(theme.templates[name], 'utf8'));
    } else if (view.configuration.templates[name]) {
      // plugin template
      template = hbs.compile(fs.readFileSync(view.configuration.templates[name], 'utf8'));
    } else if (data && data.fallbackTemplate) {
      // fallback template
      template = hbs.compile(fs.readFileSync(data.fallbackTemplate, 'utf8'));
    } else {
      log.error('Template not found: ' + name + ' themeName: ' + themeName);
      return '';
    }

    if (env === 'prod') {
      // cache it if are prod env
      view.templateCache[templateThemeName] = template;
    }

    try {
      return template(data);
    } catch(e) {
      log.error('Error on render template: ',name, template, e);
      return '';
    }
  },

  renderPage: function renderPage(req, res, data) {
    return view.renderLayout(req, res, data);
  },

  themeScriptTag: function themeScriptTag(src) {
    return '<script type="text/javascript" src="'+ src+this.assets.v+'"></script>';
  },
  themeStylesheetTag: function themeStylesheetTag(href) {
    return '<link href="'+ href+this.assets.v+'" rel="stylesheet" type="text/css">'
  },

  // --forms feature
  forms: {},

  /**
   * Resolve layout for current request
   *
   * @param  {Object}   req  express.js request
   * @param  {Object}   res  express.js response
   * @param  {Function} next callback
   */
  resolveLayout: function resolveLayout(req, res, next) {
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
  },

  helperMissing: function helperMissing() {
    if (env == 'prod') {
      log.verbose('Missing helper: ', arguments[arguments.length - 1].name);
    } else {
      log.warn('Missing helper: ', arguments[arguments.length - 1].name);
    }
  }
};

module.exports = view;
