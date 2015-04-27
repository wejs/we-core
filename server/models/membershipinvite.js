/**
 * Membership invite model
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      inviterId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },
      userId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: true
      },
      groupId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: we.db.Sequelize.TEXT,
        allowNull: false
      },
      text: {
        type: we.db.Sequelize.TEXT,
        allowNull: false
      },
      email: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      }
    }
  }

  return model;
};