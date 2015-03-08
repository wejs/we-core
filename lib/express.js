/**
* We.js express init and configs
*/

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var themeEngine = require('./themeEngine');
var log = require('./log')();

var flash = require('connect-flash');
var session = require('express-session');

module.exports = function initExpress(we) {
  var weExpress = express();

  // set default vars
  weExpress.use(function setDefaultVars(req, res, next) {
    req.we = we;
    req.context = {};
    return next();
  });

  // custom we.js responses like: res.ok() and res.forbidden()
  weExpress.use(require('./middlewares/setCustomResponses.js'));
  
  // set express engine config
  themeEngine.setExpressEngineConfig(weExpress);

  // uncomment after placing your favicon in /public
  weExpress.use(favicon(we.config.favicon));
  weExpress.use(logger('dev'));
  weExpress.use(bodyParser.json());
  weExpress.use(bodyParser.urlencoded({ extended: false }));
  
  weExpress.use(cookieParser());
  weExpress.use(session( we.config.session ));
  weExpress.use(flash());

  // form body parser
  weExpress.use(multer(we.config.upload));
  //weExpress.use(require('less-middleware')(path.join(process.cwd(), 'public')));

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