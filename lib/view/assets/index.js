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
  plugin.addCss('jquery-ui.structure', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/jquery-ui/jquery-ui.structure.css'
  });
  plugin.addCss('jquery-ui.theme', {
    type: 'plugin', weight: 7, pluginName: 'we-core',
    path: 'files/public/jquery-ui/jquery-ui.theme.css'
  });

  plugin.addJs('jquery-ui-timepicker', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/jquery-ui/jquery-ui-timepicker-addon.js'
  });
  plugin.addJs('jquery-ui-timepicker.i18n', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/jquery-ui/timepicker-i18n/jquery-ui-timepicker-addon-i18n.js'
  });

  plugin.addCss('jquery-ui-timepicker', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/jquery-ui/jquery-ui-timepicker-addon.css'
  });

  plugin.addJs('jquery.dataTables', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.dataTables/jquery.dataTables.js'
  });
  plugin.addCss('jquery.dataTables', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.dataTables/jquery.dataTables.css'
  });
  plugin.addJs('jquery.tabledrag', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.tabledrag/jquery.tabledrag.js'
  });
  plugin.addCss('jquery.tabledrag', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/jquery.tabledrag/jquery.tabledrag.css'
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

  // Jquery file upload
  plugin.addJs('jquery.ui.widget', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/js/jquery.ui.widget.js'
  });
  plugin.addJs('load-image.all', {
    type: 'plugin', weight: 6, pluginName: 'we-core',
    path: 'files/public/js/load-image.all.js'
  });

  //metis menu
  plugin.addJs('metismenu', {
    type: 'plugin', weight: 0, pluginName: 'we-core',
    path: 'files/public/metismenu/metisMenu.js'
  });
  plugin.addCss('metismenu', {
    type: 'plugin', weight: 0, pluginName: 'we-core',
    path: 'files/public/metismenu/metisMenu.css'
  });

  plugin.addJs('jquery.iframe-transport', {
    type: 'plugin', weight: 7, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.iframe-transport.js'
  });
  plugin.addJs('jquery.fileupload', {
    type: 'plugin', weight: 7, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload.js'
  });
  plugin.addJs('jquery.fileupload-process', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload-process.js'
  });
  plugin.addJs('jquery.fileupload-image', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload-image.js'
  });
  plugin.addJs('jquery.fileupload-audio', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload-audio.js'
  });
  plugin.addJs('jquery.fileupload-video', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload-video.js'
  });
  plugin.addJs('jquery.fileupload-validate', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload-validate.js'
  });
  plugin.addJs('jquery.fileupload-ui', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload-ui.js'
  });
  plugin.addJs('jquery.fileupload-jquery-ui', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/js/jquery.fileupload-jquery-ui.js'
  });

  plugin.addCss('jquery.fileupload', {
    type: 'plugin', weight: 7, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/css/jquery.fileupload.css'
  });
  plugin.addCss('jquery.fileupload-ui', {
    type: 'plugin', weight: 8, pluginName: 'we-core',
    path: 'files/public/jquery.fileupload/css/jquery.fileupload-ui.css'
  });

  // others
  plugin.addJs('moment', { location: 'footer',
    type: 'plugin', weight: 0, pluginName: 'we-core',
    path: 'files/public/js/moment.js'
  });
  plugin.addCss('font-awesome ', {
    type: 'plugin', weight: 5, pluginName: 'we-core',
    path: 'files/public/font-awesome/css/font-awesome.css'
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