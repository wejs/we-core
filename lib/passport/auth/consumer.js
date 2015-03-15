/**
 * We.js oauth2 consumer logic
 * @author Alberto Souza <contato@albertosouza.net>
 * @license [url] MIT
 */

var consumer = {}
  , util = require('./util.js')
  , logOut = require('./logOut.js')
  , log = require('../../log')()
  , db = require('../../database')
  , request = require('request');

/**
 * Init configure and return oauth2 consumer middleware
 *
 * @return {function} configured express midleware
 */
consumer.init = function() {
  // pre configure things for all requests here

  // then return the middleware
  return consumer.middleware;
}

consumer.middleware = function (req, res, next) {

  consumer.validAndLoadAccessTokenMW(req, res,function() {
    consumer.loadUserAfterTokenMW(req, res, function() {
      // set req.isAuthenticated function
      util.setIsAuthenticated(req);

      // after load current user delete access token from query and body params
      // TODO find a form to change req.options.critera.blacklist with access_token in all requests
      if (req.query.access_token){
        delete req.query.access_token;
      }

      if (req.body && req.body.access_token){
        delete req.body.access_token;
      }

      next();
    });
  });
}

consumer.receiveToken = function(req, res, next) {
  consumer.validAndLoadAccessTokenMW(req, res,function() {
    consumer.loadUserAfterTokenMW(req, res, function() {
      next();
    });
  });
}

consumer.validAndLoadAccessTokenMW = function(req, res, next) {
  var accessToken = util.parseToken(req);
  var we = req.getWe();

  // auth token not found
  if (!accessToken) return next();

  consumer.getAccessTokenFromDB(accessToken, function (err, token) {
    if (err) {
      console.error('Error on get token from db', err);
    }

    if (token) {
      // invalid token
      if ( !token.isValid ) {
        // if token dont are valid log out user to delete its token
        return logOut(req, res, next);
      }
      // set accessToken on req for use in others middlewares
      req.accessToken = token;
      return next();
    } else {
      // skip valid and load token from provider in socket.io requests
      if (req.isSocket) return next();

      //

      var validationUrl = we.config.passport.strategies.providerHost + '/api/v1/oauth2/validate-token';
      consumer.validTokenOnProviderServer(accessToken, validationUrl , function(err, tokenResp) {
        if (err) {
          console.error('Error on get token from provider server', err);
          return next(err);
        }

        // if not is valid
        if (!tokenResp || !tokenResp.isValid) {
          req.accessTokenError = tokenResp;
          return logOut(req, res, next);
        }

        var tokenUser = tokenResp.user;
        delete tokenResp.user;

        var tokenStrig;
        if(tokenResp.token.token) {
          tokenStrig = tokenResp.token.token;
        } else {
          tokenStrig = tokenResp.token;
        }

        getOrCreateUser(tokenUser, function(err, user) {
          if (err) {
            console.error('Error find od create user', err);
            return next(err);
          }

          // save id in provider
          if (!user.idInProvider) {
            user.idInProvider = tokenUser.id;
            user.save();
          }

          // set logged in user
          req.user = user;
          var newToken = {
            userId: user.id,
            tokenType: 'access',
            token: tokenStrig
          };

          // cache token on consumer DB
          db.models.authtoken.create(newToken)
          .done(function (err, salvedToken) {
            if (err) {
              log.error('Error on save validated token', err, tokenResp);
            }
            // set accessToken on req for use in others middlewares
            req.accessToken = salvedToken;
            return next();
          })
        })
      });
    }
  });
}

function getOrCreateUser (tokenUser, callback) {
  db.user.find({ where:{
    idInProvider: tokenUser.id
  }})
  .done(function (err, user) {
    if (err) {
      console.error('Error find user by id in provider', err);
      return callback(err);
    }

    if(user) return callback(null, user);

    db.user.find({ where: {
      email: tokenUser.email
    }}).done(function (err, user) {
      if (err) {
        console.error('Error find user by email', err);
        return callback(err);
      }

      if (user) return callback(null, user);

      log.info('New user from oauth will be created:', tokenUser);

      // TODO check cpf
      // user not found then create it
      db.user.create({
        username: tokenUser.username,
        biography: tokenUser.biography,
        displayName: tokenUser.displayName,
        language: tokenUser.language,
        idInProvider: tokenUser.id,
        email: tokenUser.email,
        active: true
      }).done(callback);
    });
  });
}

consumer.getAccessTokenFromDB = function (token, callback) {
  // check if access token are on DB
  db.models.authtoken.findOne({
    token: token
  })
  .done(function (err, token) {
    callback(err, token);
  });
};

consumer.validTokenOnProviderServer = function (token, validationUrl, callback) {
  request.post({
    url: validationUrl,
    json: true,
    form: { access_token: token },
    timeout: 5000
  }, function (err, r, data) {
    if (err) {
      console.error('Error trying to validate token on provider server', err);
      console.error('Http request response: ', err);
    }
    callback(err, data);
  });
}

consumer.parseReceivedToken = function () {

}

/**
 * Load user after get token
 * use only on provider server
 *
 * @param  {object}   req  express request
 * @param  {object}   res  express response
 * @param  {Function} next
 */
consumer.loadUserAfterTokenMW = function loadUserAfterTokenMW(req, res, next) {

  if (!req.accessToken || !req.accessToken.userId) {
    return next();
  }

  db.user.find(req.accessToken.userId)
  .done(function (err, user) {
    if (err) {
      log.error('loadUserAfterToken:Error on get user with auth token',err,req.accessToken);
      return next();
    }

    req.user = user;
    next();
  })
}

module.exports = consumer;
