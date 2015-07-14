var env = require('../../env');
var log = require('../../log')();

module.exports = {
  ok: function okResponse(data) {
    var res = this.res;
    var req = this.req;
    var we = req.getWe();

    res.status(200);

    if (!data) {
      if (res.locals.record) {
        data = res.locals.record;
      } else {
        data = {};
      }
    } else {
      if (!res.locals.record) {
        res.locals.record = data;
      }
    }

    we.hooks.trigger('we:before:send:okResponse', {
      req: req,
      res: res,
      data: data
    }, function() {
      if (!res.locals.responseType || res.locals.responseType == 'html') {
        return res.view(data);
      }

      var responseData = we.responses.format(res.locals.responseType, data, req, res, we);
      return res.send(responseData);
    });
  },
  created: function createdResponse(data) {
    var res = this.res;
    var req = this.req;
    var we = req.getWe();

    res.status(201);

    if (!data) {
      if (res.locals.record) {
        data = res.locals.record;
      } else {
        data = {};
      }
    } else {
      if (!res.locals.record) {
        res.locals.record = data;
      }
    }

    return we.hooks.trigger('we:before:send:createdResponse', {
      req: req,
      res: res,
      data: data
    }, function() {
      if (!res.locals.responseType || res.locals.responseType == 'html') {
        return res.view(data);
      }

      var responseData = we.responses.format(res.locals.responseType, data, req, res, we);
      return res.send(responseData);
    });
  },
  deleted: function deletedResponse() {
    var res = this.res;
    var req = this.req;
    var we = req.getWe();

    res.status(204);

    we.hooks.trigger('we:before:send:deletedResponse', {
      req: req,
      res: res
    }, function() {
      if (!res.locals.responseType || res.locals.responseType == 'html') {
        var redirectTo = we.auth.getRedirectUrl(req, res);
        if (redirectTo) return res.redirect(redirectTo);

        return res.view();
      }
      res.send();
    });
  },
  view: function viewResponse(data) {
    var req = this.req;
    var res = this.res;
    // resolve and render the template
    res.renderPage(req, res, data);
  },
  forbidden: function forbiddenResponse(data) {
    var res = this.res;

    if (!data) data = {};

    res.status(403);

    if (!res.locals.responseType || res.locals.responseType == 'html') {
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

    return res.send(response);
  },
  notFound: function notFoundResponse(data) {
    var res = this.res;
    var req = this.req;

    if (!data) data = {};

    if (env == 'dev') console.trace('404', req.path);

    res.status(404);
    res.locals.template = '404';

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      return res.view(data);
    }

    data.messages = res.locals.messages;
    return res.send(data);
  },
  serverError: function serverErrorResponse(data) {
    var res = this.res;

    res.status(500);
    res.locals.template = '500';

    if (data && env != 'prod') log.error(data);

    if (!data) data = {};

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      return res.view(data);
    }

    // set messages
    data.messages = res.locals.messages;
    return res.send(data);
  },
  badRequest: function badResponse(data) {
    var res = this.res;
    var req = this.req;

    res.status(400);

    if (env == 'dev') console.trace('400', req.path);

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

    return res.send(response);

  },
  queryError: function queryError(err) {
    var res = this.res;
    var req = this.req;
    var we = req.getWe();

    we.log.verbose('Query error:', err, err.code, err.name);

    if (err) {
      if (err.name === 'SequelizeValidationError') {
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
      }

      if (err.name === 'SequelizeDatabaseError') {
        if (err.message) {
          res.addMessage('error', err.message);
        }
      }

      if (err.errors) {
         err.errors.forEach(function (err) {
          res.addMessage('error', err.message, {
            field: err.path, rule: err.type
          });
        });
      }
    }

    res.status(400);

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      return res.view();
    }

    if (!res.locals.model) {
      // set messages
      err.messages = res.locals.messages;
      return res.send(err);
    }

    var response = {};

    if (env ===  'dev') response[res.locals.model] = err;

    response.meta = res.locals.metadata;
    // set messages
    response.messages = res.locals.messages;

    return res.send(response);
  }
};