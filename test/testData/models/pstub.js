/**
 * pstub model
 */
module.exports = function Model(we) {
  var model = {
    definition: {
      name: {
        type: we.db.Sequelize.STRING
      },
      description: {
        type: we.db.Sequelize.STRING
      }
    }
  }
  return model;
}
