/**
 * Wejs theme engine
 */

var path = require('path');
var fs = require('fs');
var projectPath = process.cwd();
var Theme = require('../class/Theme.js');
var env = require('../env.js');
var themesConfig = require('./loadThemeConfig')();
var hbs = require('hbs');

var themeEngine = {
  // template cache
  cache: {},

  themes: {},

  setExpressEngineConfig: function setExpressEngineConfig(express, we) {
    themeEngine.getWe = function(){ return we};

    themeEngine.registerHelpers();
    // view engine setup
    express.set('views', themeEngine.themes.app.config.templatesFolder);
    express.set('view engine', 'hbs');
  },

  registerHelpers: function registerHelpers() {
    var we = themeEngine.getWe();

    for (var helperName in we.config.template.helpers) {
       hbs.registerHelper( helperName, require( we.config.template.helpers[helperName] )(we, themeEngine) );
    }
  },

  /**
   * Get one tempalte from cache
   *
   * @param  {object}   theme  theme object
   * @param  {string}   template  template name
   */
  getTemplate: function getTemplate(theme, template, cb) {
    // first try to get from cache
    if (theme.templates[template])
      return cb(null, theme.templates[template]);

    // first check if this template exits in theme
    fs.stat(theme.config.templatesFolder + '/' + template + '.hbs', function(err) {
      if (err) {
        if (err.code == 'ENOENT') {
          // then use the plugin theme
          return cb(null, null);
        }
        console.error('Unknow error on find template:', err);
        return cb(null);
      }
      return cb(null, theme.config.templatesFolder + '/' + template);
    });
  },

  /**
   * Render one theme with res.locals.template and current request theme
   *
   * @param  {object} req  express request
   * @param  {object} res  express response
   * @param  {object} data template data
   */
  render: function render(req, res, data) {
    var  theme;
    if (res.locals.theme) {
      theme = themeEngine.themes[res.locals.theme];
    } else {
      theme = themeEngine.themes.app;
    }

    this.getTemplate(theme, res.locals.template, function(err, template) {
      if (err) return console.error(err);

      if (!template && res.locals.pluginPath) {
        template = res.locals.pluginPath + '/server/templates/' + res.locals.template;
      }
      return res.render(template, data);
    });
  },

  /**
   * Return the assets list
   *
   * @todo make this assets list feature work async and  move it to we-class-theme
   * @return {array} javascript file list
   */
  getProjectJsAssetsFiles: function getProjectJsAssetsFiles() {
    var assetListFile = projectPath + '/files/config/jsFileslist.json';
    if (!fs.existsSync(assetListFile)) {
      return [];
    }
    var data = fs.readFileSync(assetListFile, 'utf8');
    return JSON.parse(data);
  },
  /**
   * Return the assets list for admin theme
   *
   * @todo make this assets list feature work async and move it to we-class-theme
   * @return {array} javascript file list
   */
  getProjectAdminJsAssetsFiles: function getProjectJsAssetsFiles() {
    var assetListFile = projectPath + '/files/config/jsAdminFileslist.json';
    if (!fs.existsSync(assetListFile)) {
      return [];
    }
    var data = fs.readFileSync(assetListFile, 'utf8');
    return JSON.parse(data);
  },

  themeScriptTag: function themeScriptTag(src) {
    return '<script type="text/javascript" src="/'+ src +'"></script>';
  },
  themeStylesheetTag: function themeStylesheetTag(href) {
    return '<link href="'+ href +'" rel="stylesheet" type="text/css">'
  }
}

// load all themes
for (var themeName in themesConfig) {
  themeEngine.themes[themeName] = new Theme(themesConfig[themeName], projectPath);
  // save theme layout full path
  themeEngine.themes[themeName].layoutFullPath = path.join(
    themeEngine.themes[themeName].config.themeFolder,
    themeEngine.themes[themeName].config.viewLayout
  );
}

// log themes loaded
if (env != 'prod') {
  var themesLoaded = Object.keys(themeEngine.themes);
  console.log( themesLoaded.length + ' themes loaded: ' + themesLoaded.join(', ') );
}

module.exports = themeEngine;