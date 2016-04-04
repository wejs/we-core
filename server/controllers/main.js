/**
 * MainController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {
  /**
   * Index page route /
   */
  index: function(req, res) {
    if (!res.locals.template) res.locals.template = 'home/index';
    res.locals.title = null; // dont show duplicated titles
    res.view();
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