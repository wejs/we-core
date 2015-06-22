var express = require('express');
var path = require('path');
var view = require('../view');

module.exports = function(we, weExpress) {
  // set themes public folder
  for (var themeName in view.themes) {
    weExpress.use(
      '/public/theme/' + view.themes[themeName].name,
      express.static(path.join(
        view.themes[themeName].config.themeFolder, 'files/public'
      ))
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
  }

  weExpress.use(
    '/public/project/client',
    express.static(path.join(we.projectPath, 'client'))
  );

  // public project folder
  weExpress.use('/public', express.static(path.join(we.projectPath, 'files/public')));
}