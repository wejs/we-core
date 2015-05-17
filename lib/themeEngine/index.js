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

  // getTemplate: function getTemplate(req, res, done) {
  //   var  theme;
  //   if (res.locals.theme) {
  //     theme = themeEngine.themes[res.locals.theme];
  //   } else {
  //     theme = themeEngine.themes.app;
  //   }
  //   res.render(res.locals.template);
  //   req.we.log.info('theme:', res.locals.template);
  // },

  render: function render(req, res, data) {
    var  theme;
    if (res.locals.theme) {
      theme = themeEngine.themes[res.locals.theme];
    } else {
      theme = themeEngine.themes.app;
    }
    return res.render(theme.config.templatesFolder + '/' + res.locals.template, data);
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