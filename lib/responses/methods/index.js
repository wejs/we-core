module.exports = {
  /**
   * res.ok default success response
   *
   * By defalt they will get the record from res.locals.data
   *
   * @param  {Object} data opctional data
   */
  ok: function okResponse(data) {
    var res = this.res;
    var req = this.req;
    var we = req.we;

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
    }, function (err) {
      if (err) we.log.error(err);

      if (!res.locals.responseType || res.locals.responseType == 'html') {
        // if is edit record use the redirectTo feature
        if (req.method == 'POST' && res.locals.action == 'edit' && res.locals.redirectTo) {
          return res.redirect(res.locals.redirectTo);
        }
        return res.view(data);
      }

      var responseData = we.responses.format(res.locals.responseType, data, req, res, we);

      res.send(responseData);

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
  created: function createdResponse(data) {

    var res = this.res;
    var req = this.req;
    var we = req.we;

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
    }, function (err) {
      if (err) we.log.error(err);

      if (!res.locals.responseType || res.locals.responseType == 'html') {
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

      var responseData = we.responses.format(res.locals.responseType, data, req, res, we);

      we.freeResponseMemory(req, res);

      res.send(responseData);

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
  updated: function updatedResponse(data) {
    var res = this.res;
    var req = this.req;
    var we = req.we;

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
    }, function (err) {
      if (err) we.log.error(err);

      if (!res.locals.responseType || res.locals.responseType == 'html') {
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

      var responseData = we.responses.format(res.locals.responseType, data, req, res, we);

      res.send(responseData);

      we.freeResponseMemory(req, res);
    });
  },
  deleted: function deletedResponse() {
    var res = this.res;
    var req = this.req;
    var we = req.we;

    res.status(204);

    // use this hook in one we.js plugin to change a res.ok response
    we.hooks.trigger('we:before:send:deletedResponse', {
      req: req,
      res: res
    }, function() {

      if (!res.locals.responseType || res.locals.responseType == 'html') {
        if (res.locals.redirectTo) {
          return res.redirect(res.locals.redirectTo);
        } else {
          res.locals.deleteRedirectUrl = we.router.urlTo(res.locals.model + '.find', req.paramsArray);
          return res.redirect(res.locals.redirectTo);
        }
      }

      res.send();

      we.freeResponseMemory(req, res);
    });
  },
  view: function viewResponse(data) {
    var req = this.req;
    var res = this.res;

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

    var responseData = req.we.responses.format(res.locals.responseType, data, req, res, req.we);

    res.send(responseData);

    req.we.freeResponseMemory(req, res);
  },
  forbidden: function forbiddenResponse(data) {
    var res = this.res;
    var req = this.req;

    if (!data) data = {};

    res.status(403);

    res.locals.title = res.locals.__('response.forbidden.title');

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      res.locals.layoutName = 'fullwidth';
      res.locals.template = '403';
      return res.view(data);
    }

    if (!res.locals.model) {
      return res.send({
        messages: res.locals.messages
      });
    }

    var response = {};
    response[res.locals.model] = data;
    response.meta = res.locals.metadata;

    // set messages
    response.messages = res.locals.messages;

    res.send(response);

    req.we.freeResponseMemory(this, res);
  },
  notFound: function notFoundResponse(data) {
    var res = this.res;
    var req = this.req;

    if (!data) data = {};

    if (req.we.env == 'dev') {
      console.trace('404', req.path);
    } else {
      req.we.log.info('Not found:', req.url);
    }

    res.locals.title = res.locals.__('response.notFound.title');

    res.status(404);

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      res.locals.layoutName = 'fullwidth';
      res.locals.template = '404';
      return res.view(data);
    }

    data.messages = res.locals.messages;

    res.send(data);

    req.we.freeResponseMemory(req, res);
  },
  /**
   * Server error response
   *
   * @param  {Object} data   the error
   */
  serverError: function serverErrorResponse(data) {
    var res = this.res;

    res.status(500);

    res.locals.title = res.locals.__('response.serveError.title');

    if (!data) data = {};

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      res.locals.template = '500';
      res.locals.layoutName = 'fullwidth';
      return res.view(data);
    }

    // set messages
    data.messages = res.locals.messages;

    res.send(data);

    this.req.we.freeResponseMemory(this, res);
  },
  /**
   * bad request response
   *
   * @param  {Obejct|String} data message
   */
  badRequest: function badResponse(data) {
    var res = this.res;
    var req = this.req;

    res.status(400);

    if (req.we.env == 'dev') console.trace('400', req.path);

    if (!data) {
      data = {};
    } else if (typeof data == 'string') {
      res.addMessage('warning', data);
    }

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      if (!res.locals.template) res.locals.template = '400';
      return res.view(data);
    }

    if (!res.locals.model) {
      // set messages
      data.messages = res.locals.messages;
      return res.send(data);
    }

    var response = {};
    response[res.locals.model] = data;
    response.meta = res.locals.metadata;
    // set messages
    response.messages = res.locals.messages;
    // send the response
    res.send(response);

    req.we.freeResponseMemory(req, res);
  },
  /**
   * Sequelize query error parser
   *
   * @param  {Object} err The database error
   */
  queryError: function queryError(err) {
    var res = this.res;
    var req = this.req;
    var we = req.we;
    var isQueryError = true;

    if (err) {
      // parse all sequelize validation erros
      if (err.name === 'SequelizeValidationError') {
      // query validation error ...
        res.locals.validationError = {};
        if (res.locals.responseType === 'html') {
          err.errors.forEach(function (err) {
            if (!res.locals.validationError[err.path])
              res.locals.validationError[err.path] = [];

            res.locals.validationError[err.path].push({
              field: err.path, rule: err.type,
              message: req.__(err.message)
            });
          });
        }
      } else if (err.name === 'SequelizeDatabaseError') {
      // parse sequelize database errors
        if (err.message) {
          res.addMessage('error', err.message);
        }
      } else if (typeof err == 'string') {
        res.addMessage('error', err);
      } else {
        // unknow error type
        isQueryError = false;

        console.error('responses.queryError:unknowError: ', req.path, err, err.name);
      }

      // and for others errors
      if (err.errors) {
        err.errors.forEach(function (err) {
          res.addMessage('error', err.message, {
            field: err.path, rule: err.type
          });
        });
      }
    }

    if (isQueryError) {
      res.status(400);
    } else {
      res.status(500);
    }

    var responseData = we.responses.format(res.locals.responseType, {}, req, res, we);
    res.send(responseData);

    req.we.freeResponseMemory(req, res);
  },

  /**
   * we.js core redirect
   * @param  {String} s response status
   * @param  {String} p path
   */
  goTo: function goTo(s ,p) {
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