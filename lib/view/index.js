/**
 * wejs view feature
 */
var hbs = require('hbs');
var fs = require('fs');
var _ = require('lodash');
var env = require('../env.js');
var path = require ('path');
var Theme = require('../class/Theme.js');

var view = {
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

    we.events.on('router:before:set:controller:middleware', function(data) {
      data.middlewares.push(view.middleware);
    });

    var themesConfig = require('./loadThemeConfig')();

    // load all themes
    for (var themeName in themesConfig) {
      view.themes[themeName] = new Theme(themesConfig[themeName], we.projectPath);
    }

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
      res.locals.theme = 'app';
      // theme object getter
      res.getTheme = view.geTheme;

      next();
    })
  },

  geTheme: function geTheme() {
    return view.themes[this.locals.theme];
  },

  middleware: function middleware(req, res, next) {
    if (!res.locals.layoutName) res.locals.layoutName = 'default';
    var we = req.getWe();

    if (!res.locals.regions) res.locals.regions = {};

    // preload all widgets for this response
    // TODO add a widgets cache in memory
    we.db.models.widget.findAll({
      where: { layout: res.locals.layoutName },
      order: 'weight ASC'
    }).then(function (result) {
      var r;
      for (var i = 0; i < result.length; i++) {
        r = result[i];
        if (!res.locals.regions[r.regionName]) res.locals.regions[r.regionName] = {widgets: []};
        res.locals.regions[r.regionName].widgets.push(r.toJSON());
      }

      next();
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
    if (!res.locals.layoutName) res.locals.layoutName = 'default';
    var theme = res.getTheme();

    res.locals.body = view.renderTemplate(res.locals.template, res.locals.theme, res.locals);

    var template;
    if (theme.layouts[res.locals.layoutName]) {
      template = hbs.compile(fs.readFileSync(theme.layouts[res.locals.layoutName], 'utf8'));
    } else {
      template = hbs.compile(fs.readFileSync(view.configuration.layouts[res.locals.layoutName], 'utf8'));
    }

    if (data) _.merge(res.locals, data);

    return template(res.locals);
  },

  renderTemplate: function(name, themeName, data) {
    var theme = view.themes[themeName];
    var template;

    // TODO add suport to cache in dev env
    //
    if (theme.templates[name]) {
      template = hbs.compile(fs.readFileSync(theme.templates[name], 'utf8'));
    } else if (view.configuration.templates[name]) {
      template = hbs.compile(fs.readFileSync(view.configuration.templates[name], 'utf8'));
    } else {
      throw new Error('Template not found: ' + name + ' themeName: ' + themeName);
    }

    return template({data: data});
  },

  renderPage: function renderPage(req, res, data) {
    res.send(view.renderLayout(req, res, data));
  },


  themeScriptTag: function themeScriptTag(src) {
    return '<script type="text/javascript" src="/'+ src +'"></script>';
  },
  themeStylesheetTag: function themeStylesheetTag(href) {
    return '<link href="'+ href +'" rel="stylesheet" type="text/css">'
  }
};


module.exports = view;