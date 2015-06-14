var pathToRegexp = require('path-to-regexp');

module.exports = {
  findAll: function(req, res, next) {
    var we = req.getWe();

    if (res.locals.responseType == 'html') return res.view();

    console.log('we.routes:', we.routes);
    var urls = [];
    var path;
    var keys;

    for (var path in we.routes) {
      if (path.substr(0,4) == 'get ') {
        keys = [];
        pathToRegexp(path.substr(4), keys);

        console.log(keys);
        urls.push(path.substr(4));
      }
    }

    res.send({
      urls: urls
    });
  }
}