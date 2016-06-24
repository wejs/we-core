'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _responseType = require('../Router/responseType.js');

var _responseType2 = _interopRequireDefault(_responseType);

var _messages = require('../messages');

var _messages2 = _interopRequireDefault(_messages);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _connectFlash = require('connect-flash');

var _connectFlash2 = _interopRequireDefault(_connectFlash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* We.js express module
*/

module.exports = function initExpress(we) {
  var weExpress = (0, _express2.default)();
  // express response compression middleware
  weExpress.use((0, _compression2.default)());
  // remove uneed x-powered-by header
  weExpress.disable('x-powered-by');
  // set default vars
  weExpress.use(function setDefaultVars(req, res, next) {
    // set default req.getWe for suport with this getter
    req.getWe = function getWejs() {
      return we;
    };
    if (!res.locals) res.locals = {};
    // set message functions in response
    _messages2.default.setFunctionsInResponse(req, res);
    // save a reference to appName
    res.locals.appName = we.config.appName || '';
    // set default app title
    res.locals.title = we.config.appName || '';
    // set req to be avaible in template vars
    res.locals.req = req;
    // set metadata var
    res.locals.metadata = {};
    // metadata tags to print in html response
    res.locals.metatag = '';
    // set user role names array
    req.userRoleNames = [];
    // save env in locals
    res.locals.env = we.env;
    // add default is authenticated check
    if (!req.isAuthenticated) req.isAuthenticated = we.utils.isAuthenticated.bind(req);
    // set response type
    return (0, _responseType2.default)(req, res, function () {
      // alias targets redirect for html request
      if (we.plugins['we-plugin-url-alias'] && req.haveAlias && req.accepts('html')) {
        // is a target how have alias then redirect to it
        res.writeHead(307, {
          'Location': req.haveAlias.alias + req.aliasQuery,
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=345600',
          'Expires': new Date(Date.now() + 345600000).toUTCString()
        });
        return res.end();
      } else {
        next();
      }
    });
  });
  // send set params event
  we.events.emit('we:express:set:params', { we: we, express: weExpress });
  // custom we.js responses like: res.ok() and res.forbidden()
  weExpress.use(we.responses.setCustomResponses);
  // CORS https://github.com/troygoode/node-cors
  weExpress.options('*', (0, _cors2.default)(we.config.security.CORS));
  // favicon config
  if (we.config.favicon) weExpress.use((0, _serveFavicon2.default)(we.config.favicon));

  if (we.config.enableRequestLog) {
    var logger = require('morgan');
    weExpress.use(logger('dev'));
  }

  // robots .txt file middleware
  weExpress.get('/robots.txt', function robotsTXTmiddleware(req, res) {
    if (req.we.config.robotsTXT) {
      res.sendFile(req.we.config.robotsTXT);
    } else {
      res.notFound();
    }
  });

  weExpress.use(_bodyParser2.default.json(we.config.bodyParser));
  weExpress.use(_bodyParser2.default.json({ type: 'application/vnd.api+json' }));
  weExpress.use(_bodyParser2.default.urlencoded({ extended: false }));

  weExpress.use(we.utils.cookieParser());
  // set session store
  if (!we.config.disablePublicFolder) {
    require('./publicFolders')(we, weExpress);
  }

  weExpress.use((0, _connectFlash2.default)());
  // set public folders
  require('./publicFolders')(we, weExpress);
  return weExpress;
};