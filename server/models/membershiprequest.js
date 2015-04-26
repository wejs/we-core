/**
 * Group content
 *
 * @description :: We.js Group content model
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      userId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },
      groupId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: we.db.Sequelize.ENUM('request', 'invite'),
        defaultValue: 'request'
      },
    },

    associations: {},
    options: {
      classMethods: {},
      instanceMethods: {},
      hooks: {}
    }
  }

  return model;
};