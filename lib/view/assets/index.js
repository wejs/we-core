// var env = require('../../env');

var assets = {};

assets.projectFolder = process.cwd();

var projectPackageJSON = require(assets.projectFolder + '/package.json');

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
  var v = '?v=' + assets.getRefreshFlag();

  for (var i = 0; i < assets[tw].length; i++) {
    if (!assets[tw][i]) continue;
    for (name in assets[tw][i]) {

      if (assets[tw][i][name].location != location) continue;

      html += assets[type+'ToHTML'](assets[tw][i][name], v);
    }
  }

  return html;
}

assets.jsToHTML = function jsToHTML(cfg, v) {
  return  '<script src="'+ assets.getUrlByType[cfg.type](cfg) +v+
    '" type="text/javascript"></script>';
}

assets.cssToHTML = function jsToHTML(cfg, v) {
  return '<link href="'+ assets.getUrlByType[cfg.type](cfg) +v+
   '" rel="stylesheet" type="text/css">';
}

assets.getUrlByType = {
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

/**
 * Get asset refresh flag, in return roject version
 *
 * @return {String}
 */
assets.getRefreshFlag = function getRefreshFlag() {
  // if (env === 'prod') {
    return projectPackageJSON.version;
  // } else {
  //   return Math.floor((Math.random() * 1000) + 1);
  // }
}

assets.addCoreAssetsFiles = function addCoreAssetsFiles(plugin) {

  // jquery and jquery plugins
  plugin.addJs('jquery', { location: 'header',
    type: 'plugin', weight: 0, pluginName: 'we-core',
    path: 'files/public/js/jquery.js'
  });
  plugin.addJs('jquery.cookie', { location: 'footer',
    type: 'plugin', weight: 0, pluginName: 'we-core',
    path: 'files/public/js/jquery.cookie.js'
  });
  plugin.addJs('jquery-ui', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery-ui/jquery-ui.js'
  });
  plugin.addCss('jquery-ui', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery-ui/jquery-ui.css'
  });
  plugin.addJs('jquery.dataTables', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.dataTables/jquery.dataTables.js'
  });
  plugin.addCss('jquery.dataTables', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.dataTables/jquery.dataTables.css'
  });
  // - bootstrap
  plugin.addJs('bootstrap', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/bootstrap/dist/js/bootstrap.js'
  });
  plugin.addCss('bootstrap', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/bootstrap/dist/css/bootstrap.css'
  });
  // jquery validation
  plugin.addJs('jquery.validate', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/jquery.validate/dist/jquery.validate.js'
  });
  plugin.addJs('jquery.validate.additional-methods', {
    type: 'plugin', weight: 7, pluginName: 'we-core',
    path: 'files/public/jquery.validate/dist/additional-methods.js'
  });
  plugin.addJs('jquery.validate.bootstrap', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.validate/dist/jquery.validate.bootstrap.js'
  });

  // editor summernote
  plugin.addJs('summernote', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/summernote/dist/summernote.js'
  });
  plugin.addCss('summernote', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/summernote/dist/summernote.css'
  });
  plugin.addCss('summernote-bs3', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/summernote/dist/summernote-bs3.css'
  });
  // emoticons
  plugin.addJs('jquery.cssemoticons', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.cssemoticons/jquery.cssemoticons.js'
  });
  plugin.addCss('jquery.cssemoticons', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.cssemoticons/jquery.cssemoticons.css'
  });
  // others
  plugin.addJs('moment', { location: 'footer',
    type: 'plugin', weight: 0, pluginName: 'we-core',
    path: 'files/public/js/moment.js'
  });
  plugin.addCss('font-awesome ', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/css/font-awesome.css'
  });
  plugin.addJs('socket.io', {
    type: 'plugin', weight: 4, pluginName: 'we-core',
    path: 'files/public/js/socket.io.js'
  });
  // select 2 field
  plugin.addJs('select2', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/select2/dist/js/select2.js'
  });
  plugin.addCss('select2', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/select2/dist/css/select2.css'
  });
  // location state controll
  plugin.addJs('page', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/js/page.js'
  });
  // we.js client lib
  plugin.addJs('we', {
    type: 'plugin', weight: 10, pluginName: 'we-core',
    path: 'files/public/js/we.js'
  });
}

module.exports = assets;