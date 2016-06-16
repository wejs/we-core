module.exports = {
  /**
   * res.ok default success response
   *
   * By defalt they will get the record from res.locals.data
   *
   * @param  {Object} data opctional data
   */
  ok: function okResponse (data) {
    let res = this.res
    let req = this.req
    let we = req.we

    res.status(200)

    if (!data) {
      data = res.locals.data || {}
    } else {
      if (!res.locals.data) res.locals.data = data
    }

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:okResponse', {
      req: req,
      res: res,
      data: data
    }, function (err) {
      if (err) we.log.error(err)

      if (req.accepts('html')) {
        if (req.method == 'POST' && res.locals.action == 'edit' && res.locals.redirectTo) {
          return res.redirect(res.locals.redirectTo)
        }
      }

      res.format(we.responses.formaters)

      we.freeResponseMemory(req, res)
    })
  },
  /**
   * Record created response
   *
   * By defalt they will get the record from res.locals.data
   *
   * @param  {Object} data record data
   */
  created: function createdResponse (data) {
    let res = this.res
    let req = this.req
    let we = req.we

    res.status(201)

    if (!data) {
      data = res.locals.data || {}
    } else {
      if (!res.locals.data) res.locals.data = data
    }

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:createdResponse', {
      req: req,
      res: res,
      data: data
    }, function (err) {
      if (err) we.log.error(err);

      if (req.accepts('html')) {
        // redirect if are one html response
        if (res.locals.skipRedirect) {
          return res.view(data);
        }  else if (res.locals.redirectTo) {
           return res.redirect(res.locals.redirectTo);
        } else {
          // push id to paramsArray for use in urlTo
          req.paramsArray.push(res.locals.data.id)
          // redirect to content after create
          return res.redirect(we.router.urlTo(res.locals.model + '.findOne', req.paramsArray))
        }
      }

      res.format(we.responses.formaters)

      we.freeResponseMemory(req, res)
    })
  },
  /**
   * Record updated response
   *
   * By defalt they will get the record from res.locals.data
   *
   * @param  {Object} data optional data
   */
  updated: function updatedResponse (data) {
    let res = this.res
    let req = this.req
    let we = req.we

    res.status(200)

    if (!data) {
      data = res.locals.data || {}
    } else {
      if (!res.locals.data) res.locals.data = data
    }

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:updatedResponse', {
      req: req,
      res: res,
      data: data
    }, function (err) {
      if (err) we.log.error(err);

      if (req.accepts('html')) {
        // if is edit record use the redirectTo feature
        if (res.locals.redirectTo) {
          return res.redirect(res.locals.redirectTo);
        } else {
          // push id to paramsArray for use in urlTo
          req.paramsArray.push(res.locals.data.id);
          // redirect to content after create
          return res.redirect(we.router.urlTo(res.locals.model + '.findOne', req.paramsArray));
        }
      }

      res.format(we.responses.formaters)

      we.freeResponseMemory(req, res)
    });
  },
  /**
   * Deleted response
   *
   * redirect for html responses
   */
  deleted: function deletedResponse () {
    let res = this.res
    let req = this.req
    let we = req.we

    res.status(204)

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:deletedResponse', {
      req: req,
      res: res
    }, function() {
      if (req.accepts('html')) {
        if (
          res.locals.redirectTo &&
          (we.router.urlTo(res.locals.model + '.findOne', req.paramsArray) != res.locals.redirectTo)
        ) {
          return res.redirect(res.locals.redirectTo)
        } else {
          res.locals.deleteRedirectUrl = we.router.urlTo(res.locals.model + '.find', req.paramsArray)
          return res.redirect((res.locals.deleteRedirectUrl || '/'))
        }
      }

      res.format(req.we.responses.formaters)

      we.freeResponseMemory(req, res)
    });
  },
  view: function viewResponse (data) {
    let req = this.req
    let res = this.res

    if (!data) {
      data = res.locals.data || {}
    } else {
      if (!res.locals.data) res.locals.data = data
    }

    if (req.haveAlias) {
      // is a target how have alias then redirect to it
      res.writeHead(307, {
        'Location': req.haveAlias.alias,
        'Content-Type': 'text/plain',
        'Cache-Control':'public, max-age=345600',
        'Expires': new Date(Date.now() + 345600000).toUTCString()
      });

      req.we.freeResponseMemory(req, res)

      return res.end()
    }

    res.format(req.we.responses.formaters)

    req.we.freeResponseMemory(req, res)
  },
  forbidden: function forbiddenResponse(data) {
    let res = this.res
    let req = this.req
    let __ = ( res.locals.__ || req.we.i18n.__ )

    if (typeof data == 'string') {
      res.addMessage('error', {
        text: data
      });

      data = null
    }

    res.status(403)

    res.locals.title = __('response.forbidden.title')

    if (req.accepts('html')) {
      res.locals.layoutName = 'fullwidth'
      res.locals.template = '403'
    }

    res.format(req.we.responses.formaters)

    req.we.freeResponseMemory(this, res)
  },
  notFound: function notFoundResponse (data) {
    let res = this.res
    let req = this.req

    if (typeof data == 'string') {
      res.addMessage('error', {
        text: data
      });

      data = null
    }

    res.locals.data = null;

    if (req.we.env == 'dev') {
      console.trace('404', req.path);
    } else {
      req.we.log.info('Not found:', req.url);
    }

    res.locals.title = res.locals.__('response.notFound.title');

    res.status(404);

    if (req.accepts('html')) {
      res.locals.layoutName = 'fullwidth';
      res.locals.template = '404';
    }

    res.format(req.we.responses.formaters)

    req.we.freeResponseMemory(req, res)
  },
  /**
   * Server error response
   *
   * @param  {Object} data   the error
   */
  serverError: function serverErrorResponse (data) {
    let res = this.res
    let req = this.req
    let __ = ( res.locals.__ || req.we.i18n.__ )

    res.status(500)

    res.locals.title = __('response.serveError.title')

    if (!data) {
      data = {}
    } else if (typeof data == 'string') {
      res.addMessage('error', data)
    }

    if (req.accepts('html')) {
      res.locals.template = '500'
      res.locals.layoutName = 'fullwidth'
    }

    // send the response
    res.format(req.we.responses.formaters)
    // helper for unset variables
    this.req.we.freeResponseMemory(this, res)
  },
  /**
   * bad request response
   *
   * @param  {Obejct|String} data message
   */
  badRequest: function badResponse (data) {
    let res = this.res
    let req = this.req

    res.status(400)

    if (req.we.env == 'dev') console.trace('400', req.path)

    if (!data) {
      data = {}
    } else if (typeof data == 'string') {
      res.addMessage('warning', data)
    }

    if (req.accepts('html')) {
      // if is html
      if (!res.locals.template) res.locals.template = '400'
    }

    // send the response
    res.format(req.we.responses.formaters)

    req.we.freeResponseMemory(req, res)
  },
  /**
   * Sequelize query error parser
   *
   * @param  {Object} err The database error
   */
  queryError: function queryError (err) {
    let res = this.res
    let req = this.req
    let isQueryError = true

    if (err) {
      // parse all sequelize validation erros
      if (err.name === 'SequelizeValidationError') {
      // query validation error ...
        res.locals.validationError = {}
        if (req.accepts('html')) {
          err.errors.forEach(function (err) {
            if (!res.locals.validationError[err.path])
              res.locals.validationError[err.path] = []

            res.locals.validationError[err.path].push({
              field: err.path, rule: err.type,
              message: req.__(err.message)
            });
          });
        }
      } else if (err.name === 'SequelizeDatabaseError') {
      // parse sequelize database errors
        if (err.message) {
          res.addMessage('error', err.message)
        }
      } else if (typeof err == 'string') {
        res.addMessage('error', err)
      } else {
        // unknow error type
        isQueryError = false

        console.error('responses.queryError:unknowError: ', req.path, err, err.name)
      }

      // and for others errors
      if (err.errors) {
        err.errors.forEach(function (err) {
          res.addMessage('error', err.message, {
            field: err.path, rule: err.type
          })
        })
      }
    }

    if (isQueryError) {
      res.status(400)
    } else {
      res.status(500)
    }

    res.format(req.we.responses.formaters)

    req.we.freeResponseMemory(req, res)
  },

  /**
   * we.js core redirect
   * @param  {String} s response status
   * @param  {String} p path
   */
  goTo: function goTo (s ,p) {
    // save locals messages to flash
    this.res.moveLocalsMessagesToFlash()
    // use default redirect
    if (p) {
      this.res.redirect(s, p)
    } else {
      this.res.redirect(s)
    }
  }
}