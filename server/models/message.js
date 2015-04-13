/**
 * Message
 *
 * @module      :: Model
 */
module.exports = function Model(we) {
  var model = {
    definition: {
      fromId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      },

      // send to user id
      toId: {
        type: we.db.Sequelize.BIGINT
      },

      // room id used to send to multiples users
      roomId: {
        type: we.db.Sequelize.BIGINT
      },

      content: {
        type: we.db.Sequelize.TEXT,
        allowNull: false
      },

      status: {
        type: we.db.Sequelize.STRING,
        defaultValue: 'salved'
      },
      read: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: false
      }
    },

    options: {
      classMethods: {},
      instanceMethods: {},
      hooks: {
        beforeCreate: function(record, options, next) {
          // sanitize
          we.sanitizer.sanitizeAllAttr(record);

          // set record status do salved
          if (record.status === 'sending') {
            record.status = 'salved';
          }

          next(null, record);
        },

        beforeUpdate: function(record, options, next) {
          // sanitize
          we.sanitizer.sanitizeAllAttr(record);
          next(null, record);
        }
      }
    }
  }

  return model;
};
