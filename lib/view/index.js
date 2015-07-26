/**
 * wejs view feature
 */
var hbs = require('hbs');
var fs = require('fs');
var _ = require('lodash');
var env = require('../env.js');
var Theme = require('../class/Theme.js');
var async = require('async');
var log = require('../log')();

var view = {
  assets: require('./assets'),

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

  themes: {},

  initialize: function initialize(we) {
    view.getWe = function getWe(){ return we };

    we.hbs = hbs;

    we.events.on('router:before:set:controller:middleware', function(data) {
      data.middlewares.push(view.middleware.bind(data.config));
    });

    var themesConfig = require('./loadThemeConfig')();

    // load all themes
    for (var i = 0; i < themesConfig.enabled.length; i++) {
      view.themes[themesConfig.enabled[i]] = new Theme(
        themesConfig.enabled[i], we.projectPath
      );
      view.themes[themesConfig.enabled[i]].projectThemeName = themesConfig.enabled[i];
    }

    view.appTheme = themesConfig.app;
    view.adminTheme = themesConfig.admin;

    // log themes loaded
    if (env != 'prod') {
      var themesLoaded = Object.keys(view.themes);
      console.log( themesLoaded.length + ' themes loaded: ' + themesLoaded.join(', ') );
    }

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
    // only work with html requests
    if (res.locals.responseType != 'html') return next();

    var we = req.getWe();
    var theme = res.getTheme();

    if (!res.locals.layoutName || !theme.layouts[res.locals.layoutName])
      res.locals.layoutName = 'default';

    // set current layout regions
    if (!res.locals.regions) res.locals.regions = {};
    var regions = Object.keys(theme.layouts[res.locals.layoutName].regions);
    for (var i = 0; i < regions.length; i++) {
      res.locals.regions[regions[i]] = { widgets: [] };
    };
    // preload all widgets for this response
    // TODO add a widgets memory cache
    we.db.models.widget.findAll({
      where: {
        theme: res.locals.theme,
        layout: res.locals.layoutName,
        context: (res.locals.widgetContext || null),
        controller: { $or: [res.locals.controller , null, ''] },
        action: { $or: [res.locals.action , null, ''] },
        regionName: regions
      },
      order: 'weight ASC'
    }).then(function (widgets) {
      async.each(widgets, function (widget, nextW) {
        // set widget
        res.locals.regions[widget.regionName].widgets.push(widget);
        // run view middleware for load widget view data
        widget.viewMiddleware(req, res, nextW);
      }, next);
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

    if (!res.locals.layoutName || res.locals.layoutName === 'default') {
      if (res.locals.model && theme.layouts[res.locals.model+'/layout']) {
        res.locals.layoutName = res.locals.model+'/layout';
      } else {
        res.locals.layoutName = 'default';
      }
    }

    res.locals.body = view.renderTemplate(res.locals.template, res.locals.theme, res.locals);

    // unique name for current theme layout
    var layoutThemeName = res.locals.theme + '/' + res.locals.layoutName;

    if (env === 'prod' && view.layoutCache[layoutThemeName]) {
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

    if (data) _.merge(res.locals, data);

    if (res.locals.skipHTML) {
      return template(res.locals);
    } else {
      res.locals.layoutHtml = '<layout id="we-layout" data-we-layout="'+
        res.locals.layoutName+'" data-we-widgetcontext="'+
        (res.locals.widgetContext || '')+'" >' +
        template(res.locals) +
      '</layout>';
      return view.renderTemplate(res.locals.htmlTemplate, res.locals.theme, res.locals);
    }
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
    res.send(view.renderLayout(req, res, data));
  },

  themeScriptTag: function themeScriptTag(src) {
    return '<script type="text/javascript" src="'+ src+this.assets.v+'"></script>';
  },
  themeStylesheetTag: function themeStylesheetTag(href) {
    return '<link href="'+ href+this.assets.v+'" rel="stylesheet" type="text/css">'
  },

  // --forms feature
  forms: {}
};

module.exports = view;