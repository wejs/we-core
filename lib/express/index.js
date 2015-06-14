/**
* We.js express init and configs
*/

var express = require('express');
var compress = require('compression');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var view = require('../view');
var responseTypeMD = require('../middlewares/responseType.js');
var events = require('../events');
var messages = require('../messages');
var cors = require('cors');

var flash = require('connect-flash');

module.exports = function initExpress(we) {
  var weExpress = express();
  // express response compression
  weExpress.use(compress());
  // set default vars
  weExpress.use(function setDefaultVars(req, res, next) {
    req.getWe = function getWejs() { return we };
    if (!res.locals) res.locals = {};

    res.header('X-powered-by', 'We.js');

    req.authTokenCookieName = we.config.passport.cookieName;
    // set message functions in response
    messages.setFunctionsInResponse(req, res);
    // set default title
    res.locals.title = we.config.appName;
    // set response type
    return responseTypeMD(req, res, next);
  });

  // send set params event
  events.emit('we:express:set:params', { we: we, express: weExpress});
  // custom we.js responses like: res.ok() and res.forbidden()
  weExpress.use(we.responses.setCustomResponses);

  // CORS https://github.com/troygoode/node-cors
  weExpress.use(cors());
  weExpress.options('*', cors());

  // set express config
  view.setExpressConfig(weExpress, we);

  // uncomment after placing your favicon in /public
  if (we.config.favicon) weExpress.use(favicon(we.config.favicon));

  if (we.env != 'prod') {
    var logger = require('morgan');
    weExpress.use(logger('dev'));
  }

  weExpress.use(bodyParser.json());
  weExpress.use(bodyParser.urlencoded({ extended: false }));

  weExpress.use(cookieParser());

  // set session store
  require('./sessionStore')(we, weExpress);

  weExpress.use(flash());

  // set public folders
  require('./publicFolders')(we, weExpress);

  return weExpress;
};