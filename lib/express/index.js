/**
* We.js express init and configs
*/

var express = require('express');
var compress = require('compression');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var themeEngine = require('../themeEngine');
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
    res.locals = {};

    res.header('X-powered-by', 'We.js');

    req.authTokenCookieName = we.config.passport.cookieName;

    // set message functions in response
    messages.setFunctionsInResponse(req, res);

    res.locals.title = we.config.appName;

    return responseTypeMD(req, res, next);
    //return next();
  });

  // group pre-loader
  weExpress.param('groupId', function (req, res, next, id) {
    if (!/^\d+$/.exec(String(id))) return res.notFound();
    we.db.models.group.findById(id).then(function(group) {
      if (!group) return res.notFound();
      res.locals.group = group;

      if (!req.user) return next();

      we.db.models.membership.find({
        where: {
          memberId: req.user.id
        }
      }).then(function(membership) {
        res.locals.membership = membership;
        req.membership = membership;

        next();
      }).catch(next);
    });
  });

  // user pre-loader
  weExpress.param('userId', function (req, res, next, id) {
    if (!/^\d+$/.exec(String(id))) return res.notFound();
    we.db.models.user.findById(id).then(function (user) {
      if (!user) return res.notFound();
      res.locals.user = user;
      next();
    });
  })

  // send one event
  events.emit('we:express:set:params', we, express);

  // custom we.js responses like: res.ok() and res.forbidden()
  weExpress.use(require('../middlewares/setCustomResponses.js'));

  // CORS https://github.com/troygoode/node-cors
  weExpress.use(cors());
  weExpress.options('*', cors());

  // set express engine config
  themeEngine.setExpressEngineConfig(weExpress, we);

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

  // ember.js files for dev
  if (we.env != 'prod') {
    weExpress.use(
      '/public/project/client',
      express.static(path.join(we.projectPath, 'client'))
    );
  }

  return weExpress;
};