/**
 * We.js plugin config
 */

module.exports = function(we) {
  return {
    configs: {
      log: {
        level: 'debug'
      },

      favicon: we.projectPath + '/files/public/favicon.ico',

      routes: {
        // homepage
        'get /': {
          controller: 'main',
          action: 'index'
        },

        // 'get /emberjs/app.js': {
        //   controller: 'main',
        //   action: 'getEmberApp'
        // }
      }
    },
    onLoad: function(we, cb) {
      cb();
    }
  }   
}