/**
* We.js express module
*/

const express = require('express'),
      compress = require('compression'),
      favicon = require('serve-favicon'),
      bodyParser = require('body-parser'),
      responseTypeMD = require('../Router/responseType.js'),
      messages = require('../messages'),
      cors = require('cors');

module.exports = function initExpress (we) {
  const weExpress = express();
  // express response compression middleware
  weExpress.use(compress());
  // remove uneed x-powered-by header
  weExpress.disable('x-powered-by');
  // set default vars
  weExpress.use(function setDefaultVars (req, res, next) {
    // set default req.getWe for suport with this getter
    req.getWe = function getWejs() { return we; };
    // set message functions in response
    messages.setFunctionsInResponse(req, res);
    // save a reference to appName
    res.locals.appName = we.config.appName || '';
    // set default app title
    res.locals.title = we.config.appName || '';
    // set req to be avaible in template vars
    Object.defineProperty(res.locals, 'req', {
      get: function getReq() { return req; }
    });
    // set metadata var
    res.locals.metadata = {};
    // metadata tags to print in html response
    res.locals.metatag = '';
    // set user role names array
    req.userRoleNames = [];
    // save env in locals
    res.locals.env =  we.env;
    // add default is authenticated check
    if (!req.isAuthenticated) req.isAuthenticated = we.utils.isAuthenticated.bind(req);
    // set response type
    return responseTypeMD(req, res, ()=> {
      // alias targets redirect for html request
      if (we.plugins['we-plugin-url-alias'] && req.haveAlias && req.accepts('html')) {
        // is a target how have alias then redirect to it
        res.writeHead(307, {
          'Location': req.haveAlias.alias + (req.aliasQuery || ''),
          'Content-Type': 'text/plain',
          'Cache-Control':'public, max-age=345600',
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
  weExpress.options('*', cors(we.config.security.CORS));
  // favicon config
  if (we.config.favicon) weExpress.use(favicon(we.config.favicon));

  if (we.config.enableRequestLog) {
    const logger = require('morgan');
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

  weExpress.use(bodyParser.json(we.config.bodyParser));
  weExpress.use(bodyParser.json({ type: 'application/vnd.api+json' }));
  weExpress.use(bodyParser.urlencoded({ extended: false }));

  weExpress.use(we.utils.cookieParser());
  // set session store
  require('./sessionStore')(we, weExpress);
  // add flash middleware if session is avaible
  if (we.config.session) {
    const flash = require('connect-flash');
    weExpress.use(flash());
  }

  // set public folders
  if (!we.config.disablePublicFolder) {
    require('./publicFolders')(we, weExpress);
  }
  return weExpress;
};
