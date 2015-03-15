/**
 * User
 *
 * @module      :: Model
 * @description :: System User model
 *
 */
var bcrypt = require('bcrypt');

module.exports = function UserModel(we) {
  var model = {
    definition: {
      // model atributes //
      idInProvider: {
        type:  we.db.Sequelize.STRING,
        unique: true
      },

      username: {
        type: we.db.Sequelize.STRING,
        unique: true,
        allowNull: false,
        validate: {
          is: /^[A-Za-z0-9_-]{4,30}$/,
        }
      },

      biography: { type: we.db.Sequelize.TEXT },

      gender: { type: we.db.Sequelize.STRING },
      email: {
        // Email type will get validated by the ORM
        type: we.db.Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      // // a hashed password
      // password: { type: db.Sequelize.TEXT },

      displayName: { type: we.db.Sequelize.STRING },

      fullname: { type: we.db.Sequelize.TEXT },

      status: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: false
      },

      language: {
        type: we.db.Sequelize.STRING,
        defaultValue: 'pt-br',
        validations: {
          max: 6
        }
      },
      // estado UF
      locationState: {
        type: we.db.Sequelize.STRING
      },
      city: {
        type: we.db.Sequelize.STRING
      }
    },

    associations: {
      images:  {
        type: 'hasMany',
        model: 'image',
        inverse: 'creator'
      },
      avatar: {
        type: 'belongsTo',
        model : 'image',
        inverse: 'avatarOf'
      },
      passports:  {
        type: 'hasMany',
        model: 'passport',
        inverse: 'user'
      },
      password:  {
        type: 'belongsTo',
        model: 'password',
        inverse: 'user'
      }
    },

    options: {
      // table comment
      comment: 'We.js users table',

      classMethods: {

        validUsername: function(username){
          var restrictedUsernames = [
            'logout',
            'login',
            'auth',
            'api',
            'admin',
            'account',
            'user'
          ];

          if (restrictedUsernames.indexOf(username) >= 0) {
            return false;
          }
          return true
        }
      },
      instanceMethods: {
        toJSON: function() {
          var req;
          if (this.getReq) req = this.getReq();

          var obj = this.get();

          // delete and hide user email
          delete obj.email;
          // remove password hash from view
          delete obj.password;

          // TODO set user can here
          if (req && req.isAuthenticated()) {
            if (req.user.id == obj.id || req.user.isAdmin) {
              // campos privados
              obj.email = this.email;
            }
          }

          if (!obj.displayName) obj.displayName = obj.username;

          // delete context cache
          delete obj._context;

          return obj;
        },

        // verifyPassword: function (password, cb) {
        //   return we.db.models.user.verifyPassword(password, this.password, cb);
        // },

        // changePassword: function(user, oldPassword, newPassword, next){
        //   user.updateAttribute( 'password', newPassword , function (err) {
        //     if (!err) {
        //         next();
        //     } else {
        //         next(err);
        //     }
        //   });
        // }
      },
      hooks: {
        // Lifecycle Callbacks
        beforeCreate: function(user, options, next) {
          // never save consumers on create
          delete user.consumers;
          // dont allow to set admin and moderator flags
          delete user.isAdmin;
          delete user.isModerator;
          // sanitize
          we.sanitizer.sanitizeAllAttr(user);

          // optional password
          if (user.password) {
            this.generatePassword(user.password, function(err, hash) {
              if (err) return next(err);

              user.password = hash;
              return next(null, user);
            });
          } else {
            // ensures that user password are undefined
            delete user.password;
            next(null, user);
          }
        },
        beforeUpdate: function(user, options, next) {
          // sanitize
          user = we.sanitizer.sanitizeAllAttr(user);
          // if has user.newPassword generate the new password
          if (user.newPassword) {
            return this.generatePassword(user.newPassword, function(err, hash) {
              if (err) return next(err);
              // delete newPassword variable
              delete user.newPassword;
              // set new password
              user.password = hash;
              return next(null, user);
            });
          } else {
            return next(null, user);
          }
        }
      }
    }
  };

  // // wejs provider id


  // attributes: {


  //   birthDate: 'date',

  //   // avatar: {
  //   //   model: 'images'
  //   // },

  //   active: {
  //     type: 'boolean',
  //     defaultsTo: false
  //   },

  //   isAdmin: {
  //     type: 'boolean',
  //     defaultsTo: false
  //   },

  //   isModerator: {
  //     type: 'boolean',
  //     defaultsTo: false
  //   },


  //   // instant | daily | semanal
  //   emailNotificationFrequency: {
  //     type: 'string',
  //     defaultsTo: 'instant'
  //   },

  //   // // * @param  {boolean} preserve    true to preserve database data
  //   // roles: {
  //   //   collection: 'role',
  //   //   via: 'users'
  //   // }
  // },


  return model;
};