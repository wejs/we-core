var spawn = require('child_process').spawn;

module.exports = {
  /**
   * Index page route /
   */
  index: function(req, res) {
    res.locals.template = 'home/index';
    res.view();
  },

  findThemes: function findThemes(req, res) {
    var we = req.we;
    we.utils.async.series([
      // function (done) {
      //   if (
      //     !req.query.findNew ||
      //     typeof req.query.findNew != 'string'
      //   ) {
      //     return done();
      //   }

      //   var opts = [
      //     'info',
      //     req.query.findNew
      //   ];

      //   var npmInfo = spawn('npm', opts);

      //   res.locals.searchedThemeInfo = '';

      //   npmInfo.stdout.on('data', function (data) {
      //     res.locals.searchedThemeInfo += data;
      //   });

      //   npmInfo.on('close', function (code) {
      //     if (code == 1) {
      //       res.locals.searchedThemeNotFound = true;
      //     }
      //     done();
      //   });
      // }
    ], function() {
      res.locals.themes = we.view.themes;
      res.locals.themeConfigs = we.config.themes;

      res.ok();
    });

  }
}