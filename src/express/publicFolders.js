import express from 'express'
import path from 'path'

module.exports = function setPublicFolderMiddlewares (we, weExpress) {
  let cfg = { maxAge: we.config.cache.maxage },
    plugin,
    publicRouter = express.Router();

  if (we.view && we.view.themes) {
    // set themes public folder
    for (let themeName in we.view.themes) {
      publicRouter.use(
        '/theme/' + we.view.themes[themeName].name,
        express.static(path.join(
          we.view.themes[themeName].config.themeFolder, 'files/public'
        ), cfg)
      );
    }
  }
  
  // set plugins public folder
  for (let pluginName in we.plugins) {
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
