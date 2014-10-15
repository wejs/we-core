/**
 * AuthToken
 *
 * @module      :: Model
 * @description :: Auth Token model for create login, password and activate account tokens
 *
 */
var uuid = require('node-uuid');

module.exports = {
  schema: true,
  attributes: {

    userId: {
      type: 'string',
      required: true
    },

    token: {
      type: 'string'
    },

    tokenType: {
      type: 'string'
    },

    refreshToken: {
      type: 'string'
    },

    isValid: {
      type: 'boolean',
      defaultsTo: true
    }
  },

  beforeCreate: function(token, next) {
    // generate the token string
    token.token = uuid.v1();

    if(token.userId && !token.tokenType){
      // before invalid all user old tokens
      AccessToken.invalidOldUserTokens(token.userId, function(err, result){

        next();
      });

    }else{
      next();
    }
  },

  /**
   * Invalid old user tokens
   * @param  {string}   uid  user id to invalid all tokens
   * @param  {Function} next callback
   */
  invalidOldUserTokens: function(uid, next) {
    AccessToken.update({ userId: uid }, { isValid : false })
    .exec(function(err,results){
      if(err){
        sails.log.error(err);
        return next(err);
      }
      next(null, results);
    });
  },


  /**
  * Check if a axxess token is valid
  */
  validAccessToken: function (userId, token, cb) {

    // then get user token form db
    AccessToken.findOneByToken(token).exec(function(err, accessToken) {
      if (err) {
        return cb('Error on get token', null);
      }

      // auth token found then check if is valid
      if(accessToken){

        // user id how wons the auth token is invalid then return false
        if(accessToken.userId != userId || !accessToken.isValid){
          return cb(null, false,{
            result: 'invalid',
            message: 'Invalid token'
          });
        }

        // TODO implement expiration time


        // set this auth token as used
        accessToken.isValid = false;
        accessToken.save(function(err){
          if (err) {
            return cb('DB Error', false);
          }
          // authToken is valid
          return cb(null, true, accessToken);
        });

      } else {
        // auth token not fount
        return cb('Access token not found', false, null);
      }

    });
  }

};
