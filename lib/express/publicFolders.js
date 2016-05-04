var express = require('express');
var path = require('path');

module.exports = function setPublicFolderMiddlewares (we, weExpress){
  var cfg = { maxage: we.config.cache.maxage };

  var publicRouter = express.Router();

  // set themes public folder
  for (var themeName in we.view.themes) {
    publicRouter.use(
      '/theme/' + we.view.themes[themeName].name,
      express.static(path.join(
        we.view.themes[themeName].config.themeFolder, 'files/public'
      ), cfg)
    );
  }

  // set plugins public folder
  var plugin;
  for (var pluginName in we.plugins) {
    plugin = we.plugins[pluginName];
    publicRouter.use(
      '/plugin/' + plugin['package.json'].name + '/files',
      express.static(path.join( plugin.pluginPath, 'files/public'), cfg)
    );
  }

  // public project folder
  publicRouter.use('/project', express.static(
    path.join(we.projectPath, 'files/public'), cfg
  ));

  weExpress.use('/public', publicRouter);
}