/**
 * We.js metatag feature, set res.locals.metatag variable
 *
 */
module.exports = {
  middleware: function metatagMiddleware(req, res, next) {
    if (res.locals.metatagHandler) {
      if (typeof res.locals.metatagHandler === 'function') {
        return res.locals.metatagHandler(req, res, next);
      } else if (req.we.router.metatag.middlewares[res.locals.metatagHandler]) {
        return req.we.router.metatag.middlewares[res.locals.metatagHandler](req, res, next);
      }
    }
    // else use the default
    return req.we.router.metatag.middlewares.default(req, res, next);
  },
  middlewares: {
    default: function defaultMiddleware(req, res, next) {
      res.locals.metatag +=
        '<meta property="og:url" content="'+req.we.config.hostname+req.urlBeforeAlias+'" />'+
        '<meta property="og:title" content="'+res.locals.title+'" />' +
        '<meta property="og:site_name" content="'+res.locals.appName+'" />'+
        '<meta property="og:type" content="website" />';
      next();
    },

    userFindOne: function userFindOne(req, res, next) {
      var hostname = req.we.hostname;

      res.locals.metatag +=
        '<meta property="og:url" content="'+hostname+req.urlBeforeAlias+'" />'+
        '<meta property="og:title" content="'+res.locals.title+'" />' +
        '<meta property="og:site_name" content="'+res.locals.appName+'" />'+
        '<meta property="og:type" content="profile" />';

        if (res.locals.data.biography) {
          res.locals.metatag += '<meta property="og:description" content="'+
            req.we.utils.string(res.locals.data.biography).stripTags().truncate(200).s+
          '" />';
        }

        if (res.locals.data.avatar) {
          var img = res.locals.data.avatar[0];

          res.locals.metatag +=
            '<meta property="og:image" content="'+hostname+img.urls.large+'" />'+
            '<meta property="og:image:type" content="'+img.mime+'" />'+
            '<meta property="og:image:width" content="'+img.width+'" />'+
            '<meta property="og:image:height" content="'+img.height+'" />';
        }

      next();
    }
  }
}