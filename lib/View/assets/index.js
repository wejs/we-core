// var env = require('../../env');

var assets = {};

assets.projectFolder = process.cwd();

var projectPackageJSON = require(assets.projectFolder + '/package.json');
// use project package.json as assets version for controll assets refresh
var v = '?v=' + projectPackageJSON.version;

assets.v = v;

assets.js = {};
assets.jsByWeight = [];
assets.css = {};
assets.cssByWeight = [];

assets.addJs = function addJs(fileName, cfg) {
  if (!cfg.location) cfg.location = 'footer';
  assets.addAsset(fileName, 'js', cfg);
}

assets.addCss = function addCss(fileName, cfg) {
  if (!cfg.location) cfg.location = 'header';
  assets.addAsset(fileName, 'css', cfg);
}

assets.addAsset = function addAsset(fileName, type, cfg) {
  if (!assets[type]) {
    assets[type] = {};
    // get a clone of _weigth
    assets[type+'ByWeight'] = [];
  }

  if (cfg.ifNotExists) {
    // file exists
    if (assets[type][fileName]) return;
  }

  cfg.name = fileName;
  // default type is plugin
  if (!cfg.type) cfg.type = 'plugin';
  // get public url
  cfg.url = assets.getUrlByType[cfg.type](cfg);
  // save html tag in memory
  cfg.tag = assets[type+'ToHTML'](cfg);


  // save this asset config in order based in weight value
  if (!cfg.weight && cfg.weight !== 0 ) cfg.weight = 15;

  if (!assets[type+'ByWeight'][cfg.weight])
    assets[type+'ByWeight'][cfg.weight] = {};

  assets[type][fileName] = cfg;

  assets[type+'ByWeight'][cfg.weight][fileName] = assets[type][fileName];
}

assets.getAssetsHTML = function getAssetsHTML(type, location) {
  var html = '';
  var tw = type + 'ByWeight';
  var name;

  for (var i = 0; i < assets[tw].length; i++) {
    if (!assets[tw][i]) continue;
    for (name in assets[tw][i]) {

      if (assets[tw][i][name].location != location) continue;

      html += assets[tw][i][name].tag;
    }
  }

  return html;
}

assets.jsToHTML = function jsToHTML(cfg) {
  return  '<script src="'+cfg.url + v +'" type="text/javascript"></script>';
}

assets.themeScriptTag = function themeScriptTag(url) {
  return assets.jsToHTML({url: url});
}
assets.themeStylesheetTag = function themeScriptTag(url) {
  return assets.cssToHTML({url: url});
}

assets.cssToHTML = function jsToHTML(cfg) {
  return '<link href="'+cfg.url + v +'" rel="stylesheet" type="text/css">';
}

assets.getUrlByType = {
  project: function(cfg) {
    return cfg.path.replace('files/public/', '/public/project/');
  },
  plugin: function(cfg) {
    return cfg.path.replace('files/public/', '/public/plugin/' + cfg.pluginName + '/files/');
  },
  bower: function(cfg) {
    console.log('TODO assets.getUrlByType.bower:', cfg);
  },
  external: function(cfg) {
    console.log('TODO assets.getUrlByType.external:', cfg);
  }
}
assets.getFullPathByType = {
  plugin: function(cfg) {
    if (cfg.pluginName == projectPackageJSON.name || cfg.pluginName === 'project') {
      return cfg.path;
    } else {
      return assets.projectFolder+'/node_modules/'+cfg.pluginName+'/'+cfg.path;
    }
  },
  bower: function(cfg) {
    console.log('TODO assets.getUrlByType.bower:', cfg);
  },
  external: function(cfg) {
    console.log('TODO assets.getUrlByType.external:', cfg);
  }
}

assets.getFileList = function getFileList(type, location) {
  var files = [];
  var tw = type + 'ByWeight';
  var name, ftype;

  for (var i = 0; i < assets[tw].length; i++) {
    if (!assets[tw][i]) continue;
    for (name in assets[tw][i]) {
      // skip others locations
      if (assets[tw][i][name].location != location) continue;

      ftype = assets[tw][i][name].type;
      files.push(assets.getFullPathByType[ftype](assets[tw][i][name]));
    }
  }

  return files;
}

/**
 * Get asset refresh flag, in return roject version
 *
 * @return {String}
 */
assets.getRefreshFlag = function getRefreshFlag() {
  return v;
}

assets.addCoreAssetsFiles = function addCoreAssetsFiles(plugin) {
  var plugins = {
    'webcomponentsjs': [{
      location: 'footer',
      weight: 0, pluginName: 'we-core',
      path: 'files/public/vendor/webcomponents-lite.js'
    }],
    // jquery and jquery plugins
    'jquery': [{
      location: 'header',
      weight: 0, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.js'
    }],
    'jquery.cookie': [{
      location: 'footer',
      weight: 0, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.cookie.js'
    }],
    'jquery-ui': [{
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/jquery-ui/jquery-ui.js'
    }, {
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/jquery-ui/jquery-ui.css'
    }],
    'jquery-ui.structure': [{
      weight: 6, pluginName: 'we-core',
      path: 'files/public/vendor/jquery-ui/jquery-ui.structure.css'
    }],
    'jquery-ui.theme': [{
      weight: 7, pluginName: 'we-core',
      path: 'files/public/vendor/jquery-ui/jquery-ui.theme.css'
    }],

    'bootstrap-datetimepicker': [{
      weight: 6, pluginName: 'we-core',
      path: 'files/public/vendor/bootstrap-datetimepicker/bootstrap-datetimepicker.js'
    }, {
      weight: 6, pluginName: 'we-core',
      path: 'files/public/vendor/bootstrap-datetimepicker/bootstrap-datetimepicker.css'
    }],

    'jquery.tabledrag': [{
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.tabledrag/jquery.tabledrag.js'
    }, {
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.tabledrag/jquery.tabledrag.css'
    }],
    // jquery validation
    'jquery.validate': [{
      weight: 6, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.validate/dist/jquery.validate.js'
    }],
    'jquery.validate.additional-methods': [{
      weight: 7, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.validate/dist/additional-methods.js'
    }],

    // editor summernote
    'summernote': [{
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/summernote/dist/summernote.js'
    }, {
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/summernote/dist/summernote.css'
    }],
    'summernote-bs3': [{
      weight: 6, pluginName: 'we-core',
      path: 'files/public/vendor/summernote/dist/summernote-bs3.css'
    }],
    'summernote-ext-video': [{
      weight: 7, pluginName: 'we-core',
      path: 'files/public/vendor/summernote/plugin/summernote-ext-video.js'
    }],
    // emoticons TODO move to other plugin
    'jquery.cssemoticons': [{
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.cssemoticons/jquery.cssemoticons.js'
    }, {
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.cssemoticons/jquery.cssemoticons.css'
    }],

    // Jquery file upload
    'jquery.ui.widget': [{
      weight: 6, pluginName: 'we-core',
      path: 'files/public/vendor/jquery.ui.widget.js'
    }],
    'load-image.all': [{
      weight: 6, pluginName: 'we-core',
      path: 'files/public/vendor/load-image.all.js'
    }],
    // others
    'moment': [{
      location: 'footer',
      weight: 0, pluginName: 'we-core',
      path: 'files/public/vendor/moment.js'
    }],
    'font-awesome ': [{
      weight: 5, pluginName: 'we-core',
      path: 'files/public/vendor/font-awesome/css/font-awesome.css'
    }],
    // select 2 field
    'select2': [{
      weight: 8, pluginName: 'we-core',
      path: 'files/public/vendor/select2/dist/js/select2.js'
    }, {
      weight: 8, pluginName: 'we-core',
      path: 'files/public/vendor/select2/dist/css/select2.css'
    }],

    // we.js client lib
    // we.js css lib
    'we': [{
      weight: 10, pluginName: 'we-core',
      path: 'files/public/we.js'
    }, {
      weight: 0, pluginName: 'we-core',
      path: 'files/public/we.css'
    }]
  };

  // Register all plugins
  Object.keys(plugins).forEach(function (key) {
    var weItems = plugins[key];

    weItems.forEach(function (weItem) {
      // String.prototype.endsWith needs ES2015
      if (weItem.path.endsWith('css')) {
        plugin.addCss(key, weItem);
      } else {
        plugin.addJs(key, weItem);
      }
    });
  });

}

module.exports = assets;