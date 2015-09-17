/**
 * We.js oauth2 util functions and helpers
 * @author Alberto Souza <contato@albertosouza.net>
 * @license [url] MIT
 */
var util = {};
var db = require('../database');

/**
 * Get access token from requst param
 *
 * Getter order :
 *   Header Authorization
 *   req.cookie
 *   req.param
 *   req.session
 *
 * @param  {object} req express request param
 * @return {string}     return the token string or null
 */
util.parseToken = function parseToken(req) {
  var we = req.we;
  var accessToken;

  if (req.header) {
    // get from bearer header Authorization
    accessToken = req.header('Authorization');
    if (accessToken) {
      var token = accessToken.split(' ');
      if (token && token[0] === 'Bearer') {
        return token[1];
      }
    }
  }

  if (req.cookies) {
    // get from cookie
    if (req.cookies && req.cookies[we.config.passport.cookieName]) {
      return req.cookies[we.config.passport.cookieName];
    } else if ( req.socket && req.socket.handshake && req.socket.handshake.cookie) {
      // is socket.io request
      if(req.socket.handshake.cookie[we.config.passport.cookieName])
        return req.socket.handshake.cookie[we.config.passport.cookieName];
    }
  }

  if (req.query) {
    // get from query string or body param
    accessToken = req.query.access_token;
    if (accessToken) return accessToken;
  }

  // get from session
  if (req.session && req.session.authToken) {
    return req.session.authToken;
  }

  return null;
}

/**
 * Check if one token is expired
 *
 * @param  {object} token           AccessToken record
 * @param  {int} accessTokenTime    valid token max time
 * @return {boolean}
 */
util.checkIfTokenIsExpired = function checkIfTokenIsExpired(token, accessTokenTime) {
  // skip if dont set accessToken time
  if(!accessTokenTime) return true;
  // check if cache is valid
  var dateNow =  new Date().getTime(),
    timeDiference = dateNow - token.createdAt;
  // if cache is valid return cached page data
  if (timeDiference <= accessTokenTime) {
    // is valid
    return true;
  } else {
    // is expired
    return false;
  }
}

/**
 * Expire one user token
 *
 * @param  {string} token     AccessToken string
 * @param  {string} userId    valid token max time
 * @param  {function} cb      callback(err,results);
 */
util.expireToken = function expireOneToken(token, cb) {
  return db.models.accesstoken.update({
    token: token,
  }, { isValid: false })
  .then(function queryResult(results) {
    cb(null, results);
  });
}

/**
 * Check is user is authenticated
 * based on passport npm package
 *
 * @param  {object}  req express.js request object
 * @return {Boolean}
 */
util.setIsAuthenticated = function setIsAuthenticatedFunc(req) {
  // add one isAuthenticated function on every req object
  req.isAuthenticated = function checkIfIsAuthenticated() {
    if (req.user && req.user.id) {
      return true;
    }
    return false;
  }
}

/**
 * Load user after get token
 * use only on provider server
 *
 * @param  {object}   req  express request
 * @param  {object}   res  express response
 * @param  {Function} next
 */
util.loadUserAfterTokenMW = function loadUserAfterTokenMW(req, res, next) {

  if (!req.accessToken || !req.accessToken.userId) {
    return next();
  }

  return db.models.user.findById(req.accessToken.userId)
  .then(function (user) {
    req.user = user;
    next();
  })
}

module.exports = util;
