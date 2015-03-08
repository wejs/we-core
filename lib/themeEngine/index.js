/**
 * Wejs theme engine
 */

var hbs = require('hbs');
var path = require('path');
var fs = require('fs');
var projectPath = process.cwd();
var Theme = require('../class/Theme.js');
var env = require('../env.js');
var themesConfig = require('./loadThemeConfig')();

var themeEngine = {
  // template cache
  cache: {},

  themes: {},

  setExpressEngineConfig: function setExpressEngineConfig(express) {
    // view engine setup
    express.set('views', themeEngine.themes.app.config.templatesFolder);
    express.set('view engine', 'hbs');  
  },

  registerHelpers: function registerHelpers() {
    hbs.registerHelper('render-meta-tags', function() {
      return '';
    });

    hbs.registerHelper('render-stylesheet-tags', function() {
      return '';
    });    
    
    hbs.registerHelper('render-javascript-tags', function() {
      var theme;
      if (!this.theme) theme = themeEngine.themes.app;
      console.log('>>', theme);
    });
  },

  getTemplate: function getTemplate(req, res, done) {
    var  theme;
    if (req.context.theme) {
      theme = themeEngine.themes[req.context.theme];
    } else {
      theme = themeEngine.themes.app;
    }
    res.render(req.locals.template);
    req.we.log.info('theme:', req.locals.template);
  },

  render: function render(req, res, data) {
    return res.render(res.locals.template, data);
    themeEngine.getTemplate(req, res, function(err, template) {

    }); 
  }

};

// load all themes
for (var themeName in themesConfig) {
  themeEngine.themes[themeName] = new Theme(themesConfig[themeName], projectPath);
  // save theme layout full path
  themeEngine.themes[themeName].layoutFullPath = path.join( 
    themeEngine.themes[themeName].config.themeFolder,
    themeEngine.themes[themeName].config.viewLayout
  );
  // fs.readFile(themeEngine.themes[themeName].layoutFullPath, function(err, data) {
  //   if (err) throw new Error(err);
  //   // precompile template layouts
  //   themeEngine.themes[themeName].layout = Handlebars.compile(data);
  // });
}

// log themes loaded 
if (env != 'prod') {
  var themesLoaded = Object.keys(themeEngine.themes);
  console.log( themesLoaded.length + ' themes loaded: ' + themesLoaded.join(', ') );
}

module.exports = themeEngine;