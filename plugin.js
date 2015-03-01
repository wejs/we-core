/**
 * We.js plugin config
 */

module.exports = function pluginConstructor(we) {
  var plugin = new we.class.Plugin(__dirname);
  // set plugin configs
  plugin.setConfigs({
    log: {
      level: 'debug'
    },
    upload: {
      dest: we.projectPath + '/files/tmp',
      rename: function (fieldname, filename) {
        return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
      }
    },
    favicon: we.projectPath + '/files/public/favicon.ico'
  });
  // load models and controllers
  plugin.loadFeatures();
  // ser plugin routes
  plugin.setRoutes({
    // homepage
    'get /': {
      controller: 'main',
      action: 'index'
    },
    // 'get /emberjs/app.js': {
    //   controller: 'main',
    //   action: 'getEmberApp'
    // }    
  });

  return plugin;
};
