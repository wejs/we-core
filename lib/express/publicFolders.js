'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function setPublicFolderMiddlewares(we, weExpress) {
  var cfg = { maxAge: we.config.cache.maxage },
      plugin = void 0,
      publicRouter = _express2.default.Router();

  if (we.view && we.view.themes) {
    // set themes public folder
    for (var themeName in we.view.themes) {
      publicRouter.use('/theme/' + we.view.themes[themeName].name, _express2.default.static(_path2.default.join(we.view.themes[themeName].config.themeFolder, 'files/public'), cfg));
    }
  }

  // set plugins public folder
  for (var pluginName in we.plugins) {
    plugin = we.plugins[pluginName];
    publicRouter.use('/plugin/' + plugin['package.json'].name + '/files', _express2.default.static(_path2.default.join(plugin.pluginPath, 'files/public'), cfg));
  }

  // public project folder
  publicRouter.use('/project', _express2.default.static(_path2.default.join(we.projectPath, 'files/public'), cfg));

  weExpress.use('/public', publicRouter);
};