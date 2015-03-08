/**
 * User
 *
 * @module      :: Model
 * @description :: System User model
 *
 */
var bcrypt = require('bcrypt');

module.exports = function UserModel(db) {
  return {
    definition: {
      // model atributes //
      idInProvider: {
        type:  db.Sequelize.STRING,
        unique: true
      },

      username: {
        type: db.Sequelize.STRING,
        unique: true,
        allowNull: false,
        validate: {
          is: /^[A-Za-z0-9_-]{4,30}$/,
        }
      },

      biography: { type: db.Sequelize.STRING },
      gender: { type: db.Sequelize.TEXT },
      email: {
        // Email type will get validated by the ORM
        type: db.Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      // a hashed password
      password: {
        type: db.Sequelize.TEXT
      },

      displayName: {
        type: db.Sequelize.STRING
      },

      status: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false
      },

      language: {
        type: db.Sequelize.STRING,
        defaultValue: 'pt-br',
        validations: {
          max: 6
        }
      },
      // estado UF
      locationState: {
        type: db.Sequelize.STRING
      },
      city: {
        type: db.Sequelize.STRING
      }
    }, 
    options: {
      // table comment
      comment: "We.js users table",
      // table configs
      timestamps: true,
      createdAt:  'createdAt',
      updatedAt:  'updatedAt',
      deletedAt:  'deletedAt',
      paranoid:   true,

      classMethods: {
        /**
         * async password generation
         *
         * @param  {string}   password
         * @param  {Function} next     callback
         */
        generatePassword: function(password, next) {
          var SALT_WORK_FACTOR = sails.config.user.SALT_WORK_FACTOR;

          return bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            return bcrypt.hash(password, salt, next);
          });
        },
        /**
         * Verify user password
         *
         * @param  {string}   password user password string to test
         * @param  {string}   hash     DB user hased password
         * @param  {Function} cb       Optional callback
         * @return {boolean}           return true or false if no callback is passed
         */
        verifyPassword: function (password, hash, cb) {
          // if user dont have a password
          if(!hash){
            if(!cb) return false;
            return cb(null, false);
          }

          // if dont has a callback do a sync check
          if (!cb) return bcrypt.compareSync(password, hash);
          // else compare async
          bcrypt.compare(password, hash, cb);
        },
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
          var req = this.req;
          delete this.req;

          // delete and hide user email
          delete obj.email;
          // remove password hash from view
          delete obj.password;
     
          var obj = this.toObject();

          if (req && req.isAuthenticated()) {
            if (req.user.id == obj.id || req.user.isAdmin) {
              // campos privados
              obj.email = this.email;
            }
          }

          if (!obj.displayName) {
            obj.displayName = obj.username;
          }
            
          // ember data type
          obj.type = 'user';

         // delete context cache
          delete obj._context;

          return obj;
        },

        verifyPassword: function (password, cb) {
          return User.verifyPassword(password, this.password, cb);
        },

        changePassword: function(user, oldPassword, newPassword, next){
          user.updateAttribute( 'password', newPassword , function (err) {
            if (!err) {
                next();
            } else {
                next(err);
            }
          });
        }
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
          user = SanitizeHtmlService.sanitizeAllAttr(user);

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
          user = SanitizeHtmlService.sanitizeAllAttr(user);
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










  // // custom find or create for oauth
  // customFindORCreate: function(criteria, data, done) {
  //   User.findOne(criteria).exec(function(err, user) {
  //     if (err) return done(err);
  //     if (user) return done(null, user);
  //     User.create(data).exec(done);
  //   });
  // }
};