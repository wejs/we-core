/**
 * Wejs theme engine
 */

var Handlebars = require('handlebars');
var path = require('path');
var fs = require('fs');

var themeEngine = {
  // template cache
  cache: {},

  themes: {},

  init: function initThemeEngine(we) {
    // save one reference to the we.js object
    themeEngine.we = we;
    // skip theme engine load if now found theme config
    if (!we.configs.theme) return we.log.info('Themes config not found');
    // load all themes
    themeEngine.loadThemes(we.projectPath, we.configs.theme);
    // log themes loaded info
    if (we.env != 'prod') {
      var themesLoaded = Object.keys(themeEngine.themes);
      we.log.info( themesLoaded.length + ' themes loaded: ' + themesLoaded.join(', ') );
    }
  },

  loadThemes: function loadThemes(projectPath, themeConfigs) {
    for (var themeName in themeConfigs) {
      themeEngine.themes[themeName] = require( 
        path.resolve( projectPath, 'node_modules', themeConfigs[themeName]) 
      );
    }
  },

  getTemplate: function getTemplate(req, res, done) {
    var  theme;
    if (req.context.theme) {
      theme = themeEngine.themes[req.context.theme];
    } else {
      theme = themeEngine.themes.app;
    }

    var template = req.context.controller + '/' + req.context.action;

    var templatePath = path.resolve(theme.configs.views.path, template);
    fs.fileExists(templatePath, function(exists) {
      if (!exists) we.log.warn('!exists', exists, templatePath);

    });

    req.we.log.info('theme:', theme);

    if (req.context.controller) {

    }
  },

  render: function render(req, res, data) {
    themeEngine.getTemplate(req, res, function(err, template) {

    });
    
  }
}

module.exports = themeEngine;