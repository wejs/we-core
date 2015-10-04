/**
 * We.js title middleware handlers
 */
module.exports = {
  middleware: function titleMiddleware(data, next) {
    if (data.res.locals.titleHandler) {
      if (typeof data.res.locals.titleHandler === 'function') {
        return data.res.locals.titleHandler(data.req, data.res, next);
      } else if (data.req.we.router.title.middlewares[data.res.locals.titleHandler]) {
        return data.req.we.router.title.middlewares[data.res.locals.titleHandler](data.req, data.res, next);
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
      if (res.locals.data && res.locals.data) {
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

