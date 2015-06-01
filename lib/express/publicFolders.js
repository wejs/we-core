var express = require('express');
var path = require('path');

module.exports = function(we, weExpress) {
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

  // public project folder
  weExpress.use('/public', express.static(path.join(we.projectPath, 'files/public')));
}