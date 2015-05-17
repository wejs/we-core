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
var getAppBootstrapConfig = require('../staticConfig/getAppBootstrapConfig.js');

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

    hbs.registerHelper('render-metadata-tags', function() {
      var metatags = '';

      metatags += '<meta property="og:site_name" content="'+ we.config.appName +'">';

      if (this.title) {
        metatags += '<meta property="og:title" content="'+ this.title +'">';
      }

      if (this.metadata) {
        if (this.metadata.keywords) {
          metatags += '<meta name="keywords" content="'+ this.metadata.keywords +'">';
        } else if( we.config.appKeywords) {
          metatags += '<meta name="keywords" content="'+ we.config.appKeywords +'">';
        }

        if (we.config.metadata.hideGenerator) {
          metatags += '<meta property="generator" content="We.js">';
        }

        if (this.metadata.description) {
          metatags += '<meta name="description" content="'+ this.metadata.description +'">';
          metatags += '<meta property="og:description" content="'+ this.metadata.description +'">';
        }

        if (this.metadata.image) {
          metatags += '<meta property="og:image" content="'+ this.metadata.image +'">';
        }

        if (this.url) {
          metatags += '<meta property="og:url" content="'+ this.url +'">';
        }

        if (this.metadata.type) {
          metatags += '<meta property="og:type" content="'+ this.metadata.type +'" />';
        }

        // application metatags
        metatags += '<meta property="application-name" content="'+ we.config.appName +'">';
        metatags += '<meta property="application-url" content="'+ we.config.hostname +'">';

      }

      return metatags;
    });

    hbs.registerHelper('render-stylesheet-tags', function() {
      var tags = '';

      if (env == 'prod') {
        if (this.isAdmin) {
          tags = tags + themeEngine.themeStylesheetTag( '/public/min/admin.production.css' );
        } else {
          tags = tags + themeEngine.themeStylesheetTag( '/public/min/production.css' );
        }

      } else {
        var files = [];

        if (!we.config.disableCoreCssApp)
          files.push('/public/plugin/we-core/files/css/app.css');

        if (this.isAdmin) {
          files.push(
            '/public/theme/'+ themeEngine.themes.admin.name +'/'+ themeEngine.themes.admin.config.stylesheet
            .replace('files/public', '')
          )
        } else {
          files.push(
            '/public/theme/'+ themeEngine.themes.app.name + themeEngine.themes.app.config.stylesheet
            .replace('files/public', '')
          )
        }

        for (var i = 0; i < files.length; i++) {
          tags = tags + themeEngine.themeStylesheetTag(files[i]);
        }
      }


      return tags;
    });

    hbs.registerHelper('render-javascript-tags', function() {
      var files;
      var tags = '';
      var translationsSet = false;

      if (env == 'prod') {
        if (this.isAdmin) {
          tags = tags + themeEngine.themeScriptTag( 'public/min/admin.production.js' );
        } else {
          tags = tags + themeEngine.themeScriptTag( 'public/min/production.js' );
        }
      } else {
        if (!this.isAdmin) {
          files = themeEngine.getProjectJsAssetsFiles();
          files.push('public/tpls.hbs.js');
        } else {
          files = themeEngine.getProjectAdminJsAssetsFiles();
          files.push('public/admin.tpls.hbs.js');
        }

        for (var i = 0; i < files.length; i++) {
          tags = tags + themeEngine.themeScriptTag(files[i]);

          if (!translationsSet && files[i] ==  'public/plugin/we-core/app/beforeAll/6_Ember.I18n.js') {
            // add translations after ember.js file
            tags = tags + themeEngine.themeScriptTag('api/v1/translations.js');
            translationsSet = true;
          }
        }
      }

      if (!translationsSet) tags = tags + themeEngine.themeScriptTag('api/v1/translations.js');

      return tags;
    });

    hbs.registerHelper('render-bootstrap-config', function() {
      var configs = getAppBootstrapConfig(we);

      var tags = '<script type="text/javascript"> window.WE_BOOTSTRAP_CONFIG=';
      tags += JSON.stringify(configs);
      tags += '</script>';
      return tags;
    });

    hbs.registerHelper('t', function(string){
      return this.__(string);
    })
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