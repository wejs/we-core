/**
 * AccessToken
 *
 * @module      :: Model
 * @description :: Auth Token model for create login, password and activate account tokens
 *
 */
var crypto = require('crypto');

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
        allowNull: false
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
        * Check if a access token is valid
        */
        validAccessToken: function (userId, token, cb) {
          // then get user token form db
          we.db.models.accesstoken.find({ where: {
            token: token
          }}).done(function(err, accessToken) {
            if (err) {
              return cb('Error on get token', null);
            }

            // access token found then check if is valid
            if(accessToken){
              // user id how wons the access token is invalid then return false
              if(accessToken.userId !== userId || !accessToken.isValid){
                return cb(null, false,{
                  result: 'invalid',
                  message: 'Invalid token'
                });
              }

              // TODO implement expiration time

              // set this access token as used
              accessToken.isValid = false;
              accessToken.save(function(err){
                if (err) {
                  // not valid with error
                  return cb(err, false);
                }
                // accessToken is valid
                return cb(null, true, accessToken);
              });

            } else {
              // Access token not fount
              return cb('Access token not found', false, null);
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
          delete obj.updatedAt;
          return obj;
        }
      },
      hooks: {
        beforeValidate: function(token, options, next) {
          if (!token.token) {
            // generate the token string
            token.token = crypto.randomBytes(25).toString('hex');
          }

          next(null, token);
        }
      }
    }
  }

  return model;
}
