const haveAndAcceptsHtmlResponse = require('../../Router/haveAndAcceptsHtmlResponse.js');

module.exports = {
  /**
   * res.ok default success response
   *
   * By defalt they will get the record from res.locals.data
   *
   * @param  {Object} data opctional data
   */
  ok(data) {
    const res = this.res,
      req = this.req,
      we = req.we;

    res.status(200);

    if (!data) {
      data = res.locals.data || {};
    } else {
      if (!res.locals.data) res.locals.data = data;
    }

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:okResponse', {
      req: req,
      res: res,
      data: data
    }, (err)=> {
      if (err) we.log.error(err);

      // if accepts html and have the html response format:
      if (haveAndAcceptsHtmlResponse(req, res)) {
        if (req.method == 'POST' && res.locals.action == 'edit' && res.locals.redirectTo) {
          return res.redirect(res.locals.redirectTo);
        }
      }

      res.format(we.responses.formaters);

      we.freeResponseMemory(req, res);
    });
  },
  /**
   * Record created response
   *
   * By defalt they will get the record from res.locals.data
   *
   * @param  {Object} data record data
   */
  created(data) {
    const res = this.res,
      req = this.req,
      we = req.we;

    res.status(201);

    if (!data) {
      data = res.locals.data || {};
    } else {
      if (!res.locals.data) res.locals.data = data;
    }

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:createdResponse', {
      req: req,
      res: res,
      data: data
    }, (err)=> {
      if (err) we.log.error(err);

      if (haveAndAcceptsHtmlResponse(req, res)) {
        // redirect if are one html response
        if (res.locals.skipRedirect) {
          return res.view(data);
        }  else if (res.locals.redirectTo) {
           return res.redirect(res.locals.redirectTo);
        } else {
          // push id to paramsArray for use in urlTo
          req.paramsArray.push(res.locals.data.id);
          // redirect to content after create
          return res.redirect(we.router.urlTo(res.locals.model + '.findOne', req.paramsArray));
        }
      }

      res.format(we.responses.formaters);

      we.freeResponseMemory(req, res);
    });
  },
  /**
   * Record updated response
   *
   * By defalt they will get the record from res.locals.data
   *
   * @param  {Object} data optional data
   */
  updated(data) {
    const res = this.res,
      req = this.req,
      we = req.we;

    res.status(200);

    if (!data) {
      data = res.locals.data || {};
    } else {
      if (!res.locals.data) res.locals.data = data;
    }

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:updatedResponse', {
      req: req,
      res: res,
      data: data
    }, (err)=> {
      if (err) we.log.error(err);

      if (haveAndAcceptsHtmlResponse(req, res)) {
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

      res.format(we.responses.formaters);

      we.freeResponseMemory(req, res);
    });
  },
  /**
   * Deleted response
   *
   * redirect for html responses
   */
  deleted() {
    const res = this.res,
      req = this.req,
      we = req.we;

    res.status(204);

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:deletedResponse', {
      req: req,
      res: res
    }, ()=> {

      if (haveAndAcceptsHtmlResponse(req, res)) {
        if (
          res.locals.redirectTo &&
          (we.router.urlTo(res.locals.model + '.findOne', req.paramsArray) != res.locals.redirectTo)
        ) {
          return res.redirect(res.locals.redirectTo);
        } else {
          res.locals.deleteRedirectUrl = we.router.urlTo(res.locals.model + '.find', req.paramsArray);
          return res.redirect((res.locals.deleteRedirectUrl || '/'));
        }
      }

      res.format(req.we.responses.formaters);

      we.freeResponseMemory(req, res);
    });
  },

  /**
   * View response usefull if we have the we-plugin-view installed to send html pages in response
   *
   * @param  {Object} data Data to send that overrides data from res.locals.data
   */
  view(data) {
    const req = this.req,
      res = this.res;

    if (!data) {
      data = res.locals.data || {};
    } else {
      if (!res.locals.data) res.locals.data = data;
    }

    if (req.haveAlias) {
      // is a target how have alias then redirect to it
      res.writeHead(307, {
        'Location': req.haveAlias.alias,
        'Content-Type': 'text/plain',
        'Cache-Control':'public, max-age=345600',
        'Expires': new Date(Date.now() + 345600000).toUTCString()
      });

      req.we.freeResponseMemory(req, res);

      return res.end();
    }

    res.format(req.we.responses.formaters);

    req.we.freeResponseMemory(req, res);
  },

  /**
   * Forbidden response
   *
   * @param  {String} data Optional extra message
   */
  forbidden(data) {
    const res = this.res,
      req = this.req;

    let __ = ( res.locals.__ || req.we.i18n.__ );

    if (typeof data == 'string') {
      res.addMessage('error', {
        text: data
      });

      data = null;
    }

    res.status(403);

    res.locals.title = __('response.forbidden.title');

    if (haveAndAcceptsHtmlResponse(req, res)) {
      res.locals.layoutName = 'fullwidth';
      res.locals.template = '403';
    }
    // delete the data that user dont have access:
    delete res.locals.data;
    // add one message with forbidden to send in response:
    res.addMessage('warn', { text: 'forbidden' });

    res.format(req.we.responses.formaters);

    req.we.freeResponseMemory(this, res);
  },

  /**
   * Not found response
   *
   * @param  {String} data  optional 404 error message
   */
  notFound(data) {
    const res = this.res,
      req = this.req;

    if (typeof data == 'string') {
      res.addMessage('error', {
        text: data
      });

      data = null;
    }

    res.locals.data = null;

    if (req.we.env == 'dev') {
      console.trace('404', req.path);
    } else {
      req.we.log.info('Not found:', req.url);
    }

    res.locals.title = res.locals.__('response.notFound.title');

    res.status(404);

    if (haveAndAcceptsHtmlResponse(req, res)) {
      res.locals.layoutName = 'fullwidth';
      res.locals.template = '404';
    }

    delete res.locals.data;

    res.format(req.we.responses.formaters);

    req.we.freeResponseMemory(req, res);
  },
  /**
   * Server error response
   *
   * @param  {Object} data   the error
   */
  serverError(data) {
    const res = this.res,
      req = this.req;

    let __ = ( res.locals.__ || req.we.i18n.__ );

    res.status(500);

    req.we.log.error('ServerError:', data);

    res.locals.title = __('response.serveError.title');

    if (data && typeof data == 'string') {
      res.addMessage('error', String(data));
    }

    if (haveAndAcceptsHtmlResponse(req, res)) {
      res.locals.template = '500';
      res.locals.layoutName = 'fullwidth';
    }

    delete res.locals.data;

    // send the response
    res.format(req.we.responses.formaters);
    // helper for unset variables
    this.req.we.freeResponseMemory(this, res);
  },

  /**
   * bad request response
   *
   * @param  {Obejct|String} data message
   */
  badRequest(data) {
    const res = this.res,
        req = this.req;

    res.status(400);

    if (req.we.env == 'dev') {
      console.trace('400', req.path);
    }

    if (data && typeof data == 'string') {
      res.addMessage('warning', String(data));
    }

    if (haveAndAcceptsHtmlResponse(req, res)) {
      // if is html
      if (!res.locals.template) res.locals.template = '400';
    }

    delete res.locals.data;

    // send the response
    res.format(req.we.responses.formaters);

    req.we.freeResponseMemory(req, res);
  },

  /**
   * Sequelize query error parser
   *
   * @param  {Object} err The database error
   */
  queryError(err) {
    const res = this.res,
          req = this.req;

    if (err) {
      // parse all sequelize validation erros for html (we-plugin-view)
      if (
        haveAndAcceptsHtmlResponse(req, res) &&
        err.name === 'SequelizeValidationError'
      ) {
      // query validation error ...
        res.locals.validationError = {};

        err.errors.forEach( (err)=> {
          if (!res.locals.validationError[err.path])
            res.locals.validationError[err.path] = [];

          res.locals.validationError[err.path].push({
            field: err.path,
            rule: err.type,
            message: req.__(err.message)
          });
        });

      } else if (err.name === 'SequelizeDatabaseError') {
      // parse sequelize database errors
        if (err.message) {
          res.addMessage('error', err.message);
        }
      } else if (typeof err == 'string') {
        res.addMessage('error', err);
      } else if (err.name != 'SequelizeValidationError') {
        console.error('responses.queryError:unknowError: ', req.path, err, err.name);
      }

      // default error handler, push erros to messages and let response formaters resolve how to format this messages

      if (err.errors) {
        err.errors.forEach( (e)=> {
          res.addMessage('error', e.message, {
            field: e.path,
            rule: e.type,
            errorName: err.name,
            value: e.value,
            level: 'error',
            code: ( e.code || err.code ) // code if avaible
          });
        });
      }
    }

    if (err && err.name == 'SequelizeValidationError') {
      res.status(400);
    } else {
      res.status(500);
    }

    delete res.locals.data;

    res.format(req.we.responses.formaters);

    req.we.freeResponseMemory(req, res);
  },

  /**
   * We.js core redirect
   *
   * @param  {String} s response status
   * @param  {String} p path
   */
  goTo(s ,p) {
    // save locals messages to flash
    this.res.moveLocalsMessagesToFlash();
    // use default redirect
    if (p) {
      this.res.redirect(s, p);
    } else {
      this.res.redirect(s);
    }
  }
};