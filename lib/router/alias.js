/**
 * We.js route alias feature
 */

module.exports = {
  /**
   * http handler to use in http.createServer
   */
  httpHandler: function httpHandler(req, res) {
    var we = require('../index.js');
    // only works with GET requests
    if (req.method != 'GET') return we.express.bind(this)(req, res);

    // skip alias
    for (var i = we.config.router.alias.excludePaths.length - 1; i >= 0; i--) {
     if (req.url.indexOf(we.config.router.alias.excludePaths[i]) === 0){
       return we.express.bind(this)(req, res);
     }
    }

    var urlParts = req.url.split(/[?#]/);
    var path = urlParts[0];

    we.db.models.urlAlias.findOne({
      where: { alias: path }
    }).then(function (urlAlias) {
      if (urlAlias) {
        // save old url
        req.urlBeforeAlias = req.url;
        // save the url alias record
        req.urlAlias = urlAlias;

        req.url = urlAlias.target;

        if (urlParts[1]) req.url += '?' + urlParts[1];

        we.log.verbose('ulrAlias set for: ' + path + ' to: '+ req.url);

        we.express.bind(this)(req, res);
      } else {
        we.log.verbose('ulrAlias not found for:', path);
        // slug not found then continue with default express middlewares
        we.express.bind(this)(req, res);
      }
    }).catch(function errorInSlugHandler(err){
      we.log.error(err);
      res.status(500).end();
    });
  }
}