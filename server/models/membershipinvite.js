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
    },
    options: {
      getterMethods   : {
        acceptUrl: function() {
          return 'acceptUrl';
        },
        refuseUrl: function() {
          return 'refuseUrl';
        }
      },
      instanceMethods: {
        toJSON: function() {
          var obj = this.get();

          // obj.acceptUrl = this.acceptUrl;
          // obj.refuseUrl = '';


          return obj;
        }
      }
    }
  }

  return model;
};