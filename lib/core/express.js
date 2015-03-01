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
// var formidable = require('formidable');

module.exports = function initExpress(we) {
  var weExpress = express();

  // set default vars
  weExpress.use(function setDefaultVars(req, res, next) {
    req.we = we;
    req.context = {};
    next();
  });

  // view engine setup
  // TODO add theme config
  weExpress.set('views', path.resolve(__dirname, '..', '..', 'server', 'templates' ));
  weExpress.set('view engine', 'hbs');

  // uncomment after placing your favicon in /public
  weExpress.use(favicon(we.configs.favicon));
  weExpress.use(logger('dev'));
  weExpress.use(bodyParser.json());
  weExpress.use(bodyParser.urlencoded({ extended: false }));
  weExpress.use(cookieParser());

  weExpress.use(multer(we.configs.upload))

  //weExpress.use(require('less-middleware')(path.join(process.cwd(), 'public')));
  //
  // error handlers

  
  if (we.env != 'prod') {
    // dev public folder
    weExpress.use('/public', express.static(path.join(we.projectPath, 'files/tmp/public')));

    // development error handler
    // will print stacktrace  
    weExpress.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  } else {
    // prod public folder
    weExpress.use('/public', express.static(path.join(we.projectPath, 'files/public')));

    // production error handler
    // no stacktraces leaked to user
    weExpress.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {}
      });
    });    
  }



  return weExpress;
};