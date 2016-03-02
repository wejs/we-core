/**
 * We.js title middleware handlers
 */
module.exports = {
  middleware: function titleMiddleware(req, res, next) {
    if (res.locals.titleHandler) {
      if (typeof res.locals.titleHandler === 'function') {
        return res.locals.titleHandler(req, res, next);
      } else if (req.we.router.title.middlewares[res.locals.titleHandler]) {
        return req.we.router.title.middlewares[res.locals.titleHandler](req, res, next);
      }
    }
    next();
  },
  middlewares: {
    i18n: function i18n(req, res, next) {
      res.locals.title = req.__(res.locals.titleI18n);
      next();
    },
    recordField: function recordField(req, res, next) {
      if (res.locals.data) {
        if (res.locals.data.getDataValue) {
          res.locals.title = res.locals.data.get(res.locals.titleField);
        } else {
          res.locals.title = res.locals.data[res.locals.titleField];
        }
      }
      next();
    }
  }
}

