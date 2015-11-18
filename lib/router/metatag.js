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
        '<meta property="og:site_name" content="'+res.locals.appName+'" />';
      return next();
    }
  }
}