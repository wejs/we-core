/**
 * AuthToken
 *
 * @module      :: Model
 * @description :: Auth Token model for create login, password and activate account tokens
 *
 */
var crypto = require('crypto');

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {

      userId: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },

      providerUserId: {
        type: we.db.Sequelize.STRING
      },

      tokenProviderId: {
        type: we.db.Sequelize.STRING
      },

      tokenType: {
        type: we.db.Sequelize.STRING
      },

      token: {
        type: we.db.Sequelize.STRING,
        defaultValue: true
      },

      isValid: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: true
      }
    },


    options: {

      classMethods: {
        /**
         * Invalid old user tokens
         * @param  {string}   uid  user id to invalid all tokens
         * @param  {Function} next callback
         */
        invalidOldUserTokens: function(uid, next) {
          we.db.models.authtoken.update(
            { isValid : false },
            { where: {
              userId: uid
            }}
          )
          .done(next);
        },

        /**
        * Check if a auth token is valid
        */
        validAuthToken: function (userId, token, cb) {
          // then get user token form db
          we.db.models.authtoken.find({ where: {
            token: token
          }}).done(function(err, authToken) {
            if (err) {
              return cb('Error on get token', null);
            }

            // auth token found then check if is valid
            if(authToken){

              // user id how wons the auth token is invalid then return false
              if(authToken.userId !== userId || !authToken.isValid){
                return cb(null, false,{
                  result: 'invalid',
                  message: 'Invalid token'
                });
              }

              // TODO implement expiration time


              // set this auth token as used
              authToken.isValid = false;
              authToken.save(function(err){
                if (err) {
                  return cb(res.i18n("DB Error"), false);
                }
                // authToken is valid
                return cb(null, true, authToken);
              });

            } else {
              // auth token not fount
              return cb('Auth token not found', false, null);
            }

          });
        }

      },

      instanceMethods: {
        getResetUrl: function() {
          return we.config.hostname + '/auth/'+ this.userId +'/reset-password/' + this.token;
        },
        toJSON: function() {
          var obj = this.get();
          return obj;
        }
      },
      hooks: {
        beforeCreate: function(token, options, next) {
          if (token.userId) {
            // before invalid all user old tokens
            we.db.models.authtoken.invalidOldUserTokens(token.userId, function(err, result){
              // generete new token
              token.token = crypto.randomBytes(25).toString('hex');
              next(null, token);
            });
          } else {
            next(null, token);
          }
        }

      }
    }
  }

  return model;
}