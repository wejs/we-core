/**
 * passport model
 *
 * @module      :: Model
 * @description :: Model used to store passport auth strategy
 *
 */

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {
      // local, google, facebook ...
      protocol: { type: we.db.Sequelize.STRING, allowNull: false },

      accessToken : { type: we.db.Sequelize.STRING },

      provider   : { type: we.db.Sequelize.STRING },
      identifier : { type: we.db.Sequelize.STRING },
      tokens     : { type: we.db.Sequelize.TEXT }
    },

    associations: {
      user:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'passports',
        through: 'users_passports'
      }
    },

    options: {

      SALT_WORK_FACTOR: 10,

      enableAlias: false
    }
  }

  return model;
}