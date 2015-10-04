/**
* We.js express init and configs
*/

var express = require('express');
var compress = require('compression');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var view = require('../view');
var responseTypeMD = require('../middlewares/responseType.js');
var events = require('../events');
var messages = require('../messages');
var cors = require('cors');
var flash = require('connect-flash');

module.exports = function initExpress(we) {
  var weExpress = express();
  // express response compression middleware
  weExpress.use(compress());
  // set default app title
  weExpress.set('title', we.config.appName);
  // set default vars
  weExpress.use(function setDefaultVars(req, res, next) {
    // set default req.getWe for suport with this getter
    req.getWe = function getWejs() { return we };
    // set we.js in req
    req.we = we;
    if (!res.locals) res.locals = {};

    res.header('X-powered-by', 'We.js');

    req.authTokenCookieName = we.config.passport.cookieName;
    // set message functions in response
    messages.setFunctionsInResponse(req, res);
    // save a reference to appName
    res.locals.appName = we.config.appName;
    // set req to be avaible in template vars
    res.locals.req = req;
    // set metadata var
    res.locals.metadata = {};
    // set user role names array
    req.userRoleNames = [];
    // save env in locals
    res.locals.env =  we.env;
    // set response type
    return responseTypeMD(req, res, next);
  });
  // send set params event
  events.emit('we:express:set:params', { we: we, express: weExpress });
  // custom we.js responses like: res.ok() and res.forbidden()
  weExpress.use(we.responses.setCustomResponses);
  // CORS https://github.com/troygoode/node-cors
  weExpress.use(cors());
  weExpress.options('*', cors());
  // set express config
  view.setExpressConfig(weExpress, we);
  // favicon config
  if (we.config.favicon) weExpress.use(favicon(we.config.favicon));

  if (we.env != 'prod') {
    var logger = require('morgan');
    weExpress.use(logger('dev'));
  }

  weExpress.use(bodyParser.json(we.config.bodyParser));
  weExpress.use(bodyParser.urlencoded({ extended: false }));

  weExpress.use(we.utils.cookieParser());
  // set session store
  require('./sessionStore')(we, weExpress);

  weExpress.use(flash());
  // set public folders
  require('./publicFolders')(we, weExpress);
  return weExpress;
};