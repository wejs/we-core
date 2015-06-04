var express = require('express');
var path = require('path');
var themeEngine = require('../themeEngine');

module.exports = function(we, weExpress) {
  // set themes public folder
  var theme;
  for (var themeName in themeEngine.themes) {
    theme = themeEngine.themes[themeName];

    weExpress.use(
      '/public/theme/' + theme.name,
      express.static(path.join(theme.config.themeFolder, 'files/public'))
    );
  }

  // set plugins public folder
  var plugin;
  for (var pluginName in we.plugins) {
    plugin = we.plugins[pluginName];
    weExpress.use(
      '/public/plugin/' + plugin['package.json'].name + '/files',
      express.static(path.join( plugin.pluginPath, 'files/public'))
    );

    weExpress.use(
      '/public/plugin/' + plugin['package.json'].name + '/client',
      express.static(path.join( plugin.pluginPath, 'client'))
    );
  }

  weExpress.use(
    '/public/project/client',
    express.static(path.join(we.projectPath, 'client'))
  );

  // public project folder
  weExpress.use('/public', express.static(path.join(we.projectPath, 'files/public')));
}