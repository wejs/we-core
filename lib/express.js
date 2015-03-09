/**
* We.js express init and configs
*/

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var themeEngine = require('./themeEngine');
var log = require('./log')();
var responseTypeMD = require('./middlewares/responseType.js');
var events = require('./events');

var flash = require('connect-flash');
var session = require('express-session');

module.exports = function initExpress(we) {
  var weExpress = express();

  // set default vars
  weExpress.use(function setDefaultVars(req, res, next) {
    req.getWe = function getWejs() { return we };
    req.context = {};

    return responseTypeMD(req, res, next);
    //return next();
  });

  // -- params
  //  see http://expressjs.com/api.html#app.param
  weExpress.param(function(name, fn) {
    if (fn instanceof RegExp) {
      return function(req, res, next, val) {
        var captures;
        if (captures = fn.exec(String(val))) {
          req.params[name] = captures;
          next();
        } else {
          next('route');
        }
      }
    }
  });
  // core params
  // id params is number
  weExpress.param('id', /^\d+$/);
  weExpress.param('username', /^[A-Za-z0-9_-]{4,30}$/);
  // send one event
  events.emit('we:express:set:params', we, express);

  // custom we.js responses like: res.ok() and res.forbidden()
  weExpress.use(require('./middlewares/setCustomResponses.js'));
  
  // set express engine config
  themeEngine.setExpressEngineConfig(weExpress, we);

  // uncomment after placing your favicon in /public
  if (we.config.favicon) weExpress.use(favicon(we.config.favicon));  
  
  weExpress.use(logger('dev'));
  weExpress.use(bodyParser.json());
  weExpress.use(bodyParser.urlencoded({ extended: false }));
  
  weExpress.use(cookieParser());

  if (we.config.session) weExpress.use(session( we.config.session ));

  weExpress.use(flash());

  // prod public folder
  weExpress.use('/public', express.static(path.join(we.projectPath, 'files/public')));

  // error handlers
  if (we.env != 'prod') {
    // development error handler
    // will print stacktrace  
    weExpress.use(function(err, req, res, next) {
      log.error('Error on :', req.path, err);

      res.status(err.status || 500);
      res.view('error', {
        message: err.message,
        error: err
      });
    });
  } else {
    // production error handler
    // no stacktraces leaked to user
    weExpress.use(function(err, req, res, next) {
      log.error('Error on :', req.path, err);

      res.status(err.status || 500);
      res.view('error', {
        message: err.message,
        error: {}
      });
    });    
  }

  return weExpress;
};