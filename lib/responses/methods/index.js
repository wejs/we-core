var env = require('../../env');
var log = require('../../log')();
var themeEngine = require('../../themeEngine');

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
        return res.view();
      }
      res.send();
    });
  },
  view: function viewResponse(data) {
    var req = this.req;
    var res = this.res;
    // resolve and render the template
    themeEngine.render(req, res, data);
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

    if (!data) data = {};

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

    res.status(400);

    if (!data) data = {};

    if (!res.locals.responseType || res.locals.responseType == 'html') {
      res.locals.template = '400';
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

  }
};