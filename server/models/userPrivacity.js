/**
 * userPrivacity model
 *
 * @module      :: Model
 * @description :: Controlls the user data visibility
 *
 */

module.exports = function (we) {
  var model = {
    definition: {
      field: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      // public or private
      privacity: {
        type: we.db.Sequelize.STRING,
        defaultValue: 'public'
      },
      // privacity record for send in json response
      record: { type: we.db.Sequelize.VIRTUAL }
    },
    associations: {
      user: { type: 'belongsTo', model: 'user' }
    }
  };

  return model;
};