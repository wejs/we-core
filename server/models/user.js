/**
 * User
 *
 * @module      :: Model
 * @description :: System User model
 *
 */

var userNameRegex = /^[A-Za-z0-9_-]{4,30}$/;

module.exports = function UserModel(we) {
  var model = {
    definition: {
      username: {
        type: we.db.Sequelize.STRING,
        unique: true,
        allowNull: false,
        validate: {
          userNameIsValid: function(val) {
            if (!userNameRegex.test(val)) {
              throw new Error('user.username.invalid');
            }
          },
          uniqueUsername: function(val, cb) {
            return we.db.models.user.findOne({
              where: { username: val }, attributes: ['id']
            }).then(function (u) {
              if (u) return cb('auth.register.error.username.registered');
              cb();
            });
          }
        }
      },

      displayName: { type: we.db.Sequelize.STRING },
      fullname: { type: we.db.Sequelize.TEXT, formFieldType: 'text' },

      biography: {
        type: we.db.Sequelize.TEXT,
        formFieldType: 'html',
        formFieldHeight: 200
      },

      gender: {
        type: we.db.Sequelize.STRING,
        formFieldType: 'select' ,
        fieldOptions: { M: 'Masculine', F: 'Feminine' }
      },

      email: {
        // Email type will get validated by the ORM
        type: we.db.Sequelize.STRING,
        allowNull: false,
        unique: true,
        formFieldType: 'static-text',
        validate: {
          isEmail: true,
          notEmptyOnCreate: function(val) {
            if (this.isNewRecord) {
              if (!val) {
                throw new Error('auth.register.email.required');
              }
            }
          },
          equalEmailFields: function(val) {
            if (this.isNewRecord) {
              if (this.getDataValue('email') != val) {
                throw new Error('auth.email.and.confirmEmail.diferent');
              }
            }
          },
          uniqueEmail: function(val, cb) {
            return we.db.models.user.findOne({
              where: { email: val }, attributes: ['id']
            }).then(function (u) {
              if (u) return cb('auth.register.email.exists');
              cb();
            });
          }
        }
      },

      active: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: false,
        formFieldType: null
      },

      language: {
        type: we.db.Sequelize.STRING,
        defaultValue: 'pt-br',
        validations: {
          max: 6
        },
        formFieldType: null // TODO
      },

      confirmEmail: {
        type: we.db.Sequelize.VIRTUAL,
        formFieldType: null,
        set: function (val) {
          this.setDataValue('confirmEmail', val);
        },
        validate: {
          isEmail: true,
          notEmptyOnCreate: function(val) {
            if (this.isNewRecord) {
              if (!val) {
                throw new Error('auth.register.confirmEmail.required');
              }
            }
          },
          equalEmailFields: function(val) {
            if (this.isNewRecord) {
              if (this.getDataValue('email') != val) {
                throw new Error('auth.email.and.confirmEmail.diferent');
              }
            }
          }
        }
      },

      acceptTerms: {
        type: we.db.Sequelize.BOOLEAN,
        equals: true,
        formFieldType: null
      }
    },

    associations: {
      passports:  {
        type: 'belongsToMany',
        model: 'passport',
        inverse: 'user',
        through: 'users_passports'
      },
      roles: {
        type: 'belongsToMany',
        model: 'role',
        inverse: 'users',
        through: 'users_roles'
      }
    },

    options: {
     termFields: {
        organization: {
          vocabularyName: 'Organization',
          canCreate: true,
          formFieldMultiple: false,
          onlyLowercase: false
        },
      },
      imageFields: {
        avatar: { formFieldMultiple: false },
        banner: { formFieldMultiple: false }
      },

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
        },
        /**
         * Context loader, preload current request record and related data
         *
         * @param  {Object}   req  express.js request
         * @param  {Object}   res  express.js response
         * @param  {Function} done callback
         */
        contextLoader: function contextLoader(req, res, done) {
          if (!res.locals.id || !res.locals.loadCurrentRecord) return done();

          this.findById(res.locals.id)
          .then(function (record) {
             res.locals.record = record;

            if (record && record.id && req.isAuthenticated()) {
              // ser role owner
              if (req.user.id == record.id)
                if(req.userRoleNames.indexOf('owner') == -1 ) req.userRoleNames.push('owner');
            }
            return done();
          });
        }
      },
      instanceMethods: {
        getPassword: function getPassword() {
          return we.db.models.password.findOne({
            where: { userId: this.id }
          });
        },
        verifyPassword: function verifyPassword(password, cb) {
          return this.getPassword().then( function(passwordObj){
            if (!passwordObj) return cb(null, false);
            passwordObj.validatePassword(password, cb);
          });
        },
        updatePassword: function updatePassword(newPassword, cb) {
          var user = this;
          return this.getPassword().then( function (password){
            if (!password) {
              // create one password if this user dont have one
              return we.db.models.password.create({
                userId: user.id,
                password: newPassword
              }).then(function (password) {
                return cb(null, password);
              })
            }
            // update
            password.password = newPassword;
            password.save().then(function(r){ cb(null, r) });
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
        }
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
          // set default displayName as username
          if (!user.displayName) user.displayName = user.username;
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
          // set default displayName as username
          if (!user.displayName) user.displayName = user.username;
          // dont change user acceptTerms in update
          user.acceptTerms = true;
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