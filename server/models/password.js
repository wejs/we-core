/**
 * passwrod model
 *
 * @module      :: Model
 * @description :: Model used to store user passwords
 *
 */
var bcrypt = require('bcryptjs');

var newPasswordValidation = {
  notEmptyOnCreate: function(val) {
    if (this.isNewRecord) {
      if (!val) {
        throw new Error('auth.register.confirmPassword.required');
      }
    }
  },
  equalPasswordFields: function(val) {
    if (this.isNewRecord) {
      if (this.getDataValue('password') != val) {
        throw new Error('auth.confirmPassword.and.newPassword.diferent');
      }
    }

  }
};

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      userId : { type: we.db.Sequelize.STRING },
      active : { type: we.db.Sequelize.BOOLEAN, defaultValue: true },

      password    : {
        type: we.db.Sequelize.TEXT,
        validate: newPasswordValidation
      },
      confirmPassword: {
        type: we.db.Sequelize.VIRTUAL,
        set: function set(val) {
          this.setDataValue('confirmPassword', val);
        },
        validate: newPasswordValidation
      }
    },

    options: {

      SALT_WORK_FACTOR: 10,

      classMethods: {
        /**
         * async password generation
         *
         * @param  {string}   password
         * @param  {Function} next     callback
         */
        generatePassword: function(password, next) {
          var SALT_WORK_FACTOR = this.options.SALT_WORK_FACTOR;

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
          if (!hash) {
            if(!cb) return false;
            return cb(null, false);
          }

          // if dont has a callback do a sync check
          if (!cb) return bcrypt.compareSync(password, hash);
          // else compare async
          bcrypt.compare(password, hash, cb);
        }
      },

      instanceMethods: {
        validatePassword: function (password, next) {
          bcrypt.compare(password, this.password, next);
        },
        toJSON: function() {
          var obj = this.get();
          return obj;
        }
      },
      hooks: {
        // Lifecycle Callbacks
        beforeCreate: function(record, options, next) {
          this.generatePassword(record.password, function(err, hash) {
            if (err) return next(err);
            record.password = hash;
            // remove old user paswords
            we.db.models.password.destroy({
              where: { userId: record.userId }
            }).then(function(){
              return next(null, record);
            });
          });
        },
        beforeUpdate: function(record, options, next) {
          this.generatePassword(record.password, function(err, hash) {
            if (err) return next(err);
            record.password = hash;
            return next(null, record);
          });
        },
      }
    }
  }

  return model;
}