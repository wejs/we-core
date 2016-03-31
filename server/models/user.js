/**
 * User
 *
 * @module      :: Model
 * @description :: System User model
 *
 */

var userNameRegex = /^[A-Za-z0-9_-]{2,30}$/;

module.exports = function UserModel(we) {
  var model = {
    definition: {
      username: {
        type: we.db.Sequelize.STRING,
        unique: true,
        validate: {
          userNameIsValid: function(val) {
            if (!userNameRegex.test(val)) {
              throw new Error('user.username.invalid');
            }
          },
          uniqueUsername: function(val, cb) {
            if(!val) return cb();
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
      fullName: { type: we.db.Sequelize.TEXT, formFieldType: 'text' },

      biography: {
        type: we.db.Sequelize.TEXT,
        formFieldType: 'html',
        formFieldHeight: 200
      },

      gender: {
        type: we.db.Sequelize.STRING,
        formFieldType: 'select' ,
        fieldOptions: { M: 'Male', F: 'Female' }
      },

      email: {
        // Email type will get validated by the ORM
        type: we.db.Sequelize.STRING,
        allowNull: false,
        unique: true,
        formFieldType: 'user-email',
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
        defaultValue: true,
        equals: true,
        allowNull: false,
        formFieldType: null
      },

      roles: {
        type: we.db.Sequelize.TEXT,
        formFieldType: null,
        skipSanitizer: true,
        get: function()  {
          if (this.getDataValue('roles'))
            return JSON.parse( this.getDataValue('roles') );
          return [];
        },
        set: function(object) {
          if (typeof object == 'object') {
            this.setDataValue('roles', JSON.stringify(object));
          } else {
            throw new Error('invalid error in user roles value: ', object);
          }
        }
      }
    },

    associations: {
      passports:  {
        type: 'belongsToMany',
        model: 'passport',
        inverse: 'user',
        through: 'users_passports'
      }
    },

    options: {
      titleField: 'displayName',
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
             res.locals.data = record;

            if (record && record.id && req.isAuthenticated()) {
              // ser role owner
              if (req.user.id == record.id)
                if(req.userRoleNames.indexOf('owner') == -1 ) req.userRoleNames.push('owner');
            }
            return done();
          });
        },

        // returns an url alias
        urlAlias: function urlAlias(record) {
          return {
            alias: '/'+ we.i18n.__('user') +'/' + record.id + '-'+  we.utils
              .string( record.username || record.displayName ).slugify().s,
            target: '/user/' + record.id,
          }
        },

        loadPrivacity: function loadPrivacity(record, done) {
          we.db.models.userPrivacity.findAll({
            where: { userId: record.id },
            raw: true
          }).then(function (p) {
            record.privacity = p;
            done();
          }).catch(done);
        }
      },
      instanceMethods: {
        getPassword: function getPassword (){
          return we.db.models.password.findOne({
            where: { userId: this.id }
          });
        },
        verifyPassword: function verifyPassword (password, cb){
          return this.getPassword().then( function(passwordObj){
            if (!passwordObj) return cb(null, false);
            passwordObj.validatePassword(password, cb);
          });
        },
        updatePassword: function updatePassword (newPassword, cb){
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
          var obj = this.get();

          // delete and hide user email
          delete obj.email;
          // remove password hash from view
          delete obj.password;

          if (!obj.displayName) obj.displayName = obj.username;

          return obj;
        },
        generateDefaultWidgets: function generateDefaultWidgets(cb) {
          var self = this;

          we.utils.async.series([
            function (done) {
              we.db.models.widget.bulkCreate([{
                title: null,
                type: 'user-logo-and-displayname',
                regionName: 'sidebar',
                context: 'user-' + self.id,
                theme: null,
                weight: 0
              },{
                title: null,
                type: 'usermenu',
                regionName: 'sidebar',
                context: 'user-' + self.id,
                theme: null,
                weight: 2
              }
            ]).then(function() {
                done();
              }).catch(done);
            }
          ], cb);
        },

        getRoles: function getRoles() {
          var self = this;
          return new we.db.Sequelize
          .Promise(function getRolesPromisse(resolve){
            resolve(self.roles);
          });
        },

        setRoles: function setRoles(rolesToSave) {
          var self = this;
          return new we.db.Sequelize
          .Promise(function setRolesPromisse(resolve, reject){
            self.roles = rolesToSave;
            self.save().then(resolve).catch(reject);
          });
        },

        addRole: function addRole(role) {
          if (typeof role == 'object') {
            role = role.name;
          }

          var self = this;

          return new we.db.Sequelize
          .Promise(function setRolesPromisse(resolve, reject){

            var roles = self.roles;
            // if this user already have the role, do nothing
            if (roles.indexOf(role) > -1) return resolve(self);
            // else add the role and save the user
            roles.push(role);

            self.roles = roles;

            self.save().then(resolve).catch(reject);
          });
        }
      },
      hooks: {
        beforeValidate: function beforeValidate(user, options, next) {
          if (user.isNewRecord) {
            // dont set password on create
            user.dataValues.password = null;
            user.dataValues.passwordId = null;
          }
          next(null, user);
        },
        // Lifecycle Callbacks
        beforeCreate: function beforeCreate(user, options, next) {
          // set default displayName as username
          if (!user.displayName) {
            if (user.fullName && user.fullName.trim()) {
              user.displayName = user.fullName.split(' ')[0];
            } else if (user.username) {
              user.displayName = user.username;
            }
          }

          // never save consumers on create
          delete user.consumers;
          // dont allow to set admin and moderator flags
          delete user.isAdmin;
          delete user.isModerator;
          next(null, user);
        },
        beforeUpdate: function beforeUpdate(user, options, next) {
          // set default displayName as username
          if (!user.displayName) {
            if (user.fullName && user.fullName.trim()) {
              user.displayName = user.fullName.split(' ')[0];
            } else if (user.username) {
              user.displayName = user.username;
            }
          }

          // dont change user acceptTerms in update
          user.acceptTerms = true;
          return next(null, user);
        },
        afterCreate: function afterCreate(record, options, next) {
          we.utils.async.parallel([
            record.generateDefaultWidgets.bind(record)
          ], next);
        },

        afterFind: function afterFind(record, options, next) {
          if (!record) return next();

          // load privacity to hide user fields in toJSON
          if (we.utils._.isArray(record)) {
            we.utils.async.eachSeries(record, function (r, next) {
              we.db.models.user.loadPrivacity(r, next);
            }, next);
          } else {
            we.db.models.user.loadPrivacity(record, next);
          }
        }
      }
    }
  };

  return model;
};