/**
 * MainController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */
var fs = require('fs');

module.exports = {
  /**
   * Index page route /
   */
  index: function(req, res) {
    var we = req.getWe();

    res.locals.template = 'home/index';
    res.view({ title: we.config.appName });
  },

  /**
   * Client side configs
   * @param  {object} req
   * @param  {object} res
   */
  getConfigsJS: function(req, res) {
    var we = req.getWe();

    // set header to never cache this response
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    var configs = we.getAppBootstrapConfig(we);

    return res.send(configs);
  },

  getRoutes: function(req, res) {
    var we = req.getWe();
    var getRoutes = {};
    var url;

    for(var routePath in we.routes) {
      if (routePath.substring(0, 4) === 'get ' && we.routes[routePath].responseType != 'json') {
        url = routePath.replace('get ', '');
        getRoutes[url] = we.routes[routePath];
      }
    }

    res.send(getRoutes);
  }
};

/**
 * Search for one locale file folder
 *
 * @param  {Object}   we       we.js
 * @param  {String}   locale   locale to search for
 * @param  {Function} callback
 */
function getTranslationFilePath (we, locale, callback) {
  var localePath = null;
  // check if exists in project
  localePath = we.projectPath + '/config/locales/' + locale + '.json';
  fs.exists (localePath, function (exists) {
    if (exists) {
      return callback(localePath);
    }

    we.log.info('Localization file not found in project', locale);

    callback();
  });
}

