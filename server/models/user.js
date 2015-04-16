/**
 * User
 *
 * @module      :: Model
 * @description :: System User model
 *
 */

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

      displayName: { type: we.db.Sequelize.STRING },

      fullname: { type: we.db.Sequelize.TEXT },

      active: {
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
      // inGroups: {
      //   type: 'belongsToMany',
      //   model: 'user',
      //   through: {
      //     model: 'membership',
      //     scope: {
      //       modelName: 'group'
      //     }
      //   },
      //   // constraints: false,
      //   foreignKey: 'id',
      //   otherKey: 'memberId'
      // },

      avatar: {
        type: 'belongsTo',
        model : 'image',
        inverse: 'avatarOf',
        foreignKey : 'avatarId'
      },
      passports:  {
        type: 'belongsToMany',
        model: 'passport',
        inverse: 'user',
        through: 'users_passports'
      },
      password:  {
        type: 'belongsTo',
        model: 'password',
        inverse: 'user'
      },

      roles: {
        type: 'belongsToMany',
        model: 'role',
        inverse: 'users',
        through: 'users_roles'
      },

      pages:  {
        emberOnly: true,
        type: 'belongsTo',
        model: 'page',
        inverse: 'creator'
      },

      vocabularies:  {
        emberOnly: true,
        type: 'hasMany',
        model: 'vocabulary',
        inverse: 'creator'
      },

      comments:  {
        emberOnly: true,
        type: 'hasMany',
        model: 'comments',
        inverse: 'creator'
      },

      images:  {
        emberOnly: true,
        type: 'hasMany',
        model: 'image',
        inverse: 'creator'
      },

      urls:  {
        emberOnly: true,
        type: 'hasMany',
        model: 'url',
        inverse: 'creator'
      },

      groups:  {
        emberOnly: true,
        type: 'hasMany',
        model: 'group',
        inverse: 'creator'
      },

      wembeds:  {
        emberOnly: true,
        type: 'hasMany',
        model: 'wembed',
        inverse: 'creator'
      },

      posts:  {
        emberOnly: true,
        type: 'hasMany',
        model: 'post',
        inverse: 'creator'
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
        verifyPassword: function(password, cb) {
          this.getPassword().done( function(err, passwordObj){
            if (err) return cb(err);
            if (!passwordObj) return cb(null, false);
            passwordObj.validatePassword(password, cb);
          });
        },
        updatePassword: function updatePassword(newPassword, cb) {
          var user = this;
          this.getPassword().done( function(err, password){
            if (err) return cb(err);

            if (!password) {
              // create one password if this user dont have one
              return we.db.models.password.create({
                userId: user.id,
                password: newPassword
              }).done(function (err, password) {
                if (err) return cb(err);
                user.setPassword(password).done(function () {
                  user.passwordId = password.id;
                  return cb(null, password);
                })
              })
            }
            // update
            password.password = newPassword;
            password.save().done(cb);
          });
        },
        toJSON: function toJSON() {
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
        beforeValidate: function(user, options, next) {
          if (user.isNewRecord) {
            // dont set password on create
            user.dataValues.password = null;
            user.dataValues.passwordId = null;
          }

          next(null, user);
        },
        // Lifecycle Callbacks
        beforeCreate: function(user, options, next) {
          // never save consumers on create
          delete user.consumers;
          // dont allow to set admin and moderator flags
          delete user.isAdmin;
          delete user.isModerator;
          // sanitize
          we.sanitizer.sanitizeAllAttr(user);

          next(null, user);
        },
        beforeUpdate: function(user, options, next) {
          // sanitize attrs
          we.sanitizer.sanitizeAllAttr(user);
          return next(null, user);
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