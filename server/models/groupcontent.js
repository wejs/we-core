/**
 * Group content
 *
 * @description :: We.js Group content model
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      contentModelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false,
        validate: {
          modelExists: function(value) {
            if (!we.db.models[value]) {
              throw new Error('Model dont exists or dont are valid');
            }
          }
        }
      },
      contentId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },

      groupName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      groupId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      }
    },

    associations: {},
    hooks: {
      beforeValidate: function(instance, options, done) {
        we.db.models[instance.contentModelName].find({
          where: { id: instance.contentId},
          attributes: ['id']
        }).done(function(err, model) {
          if (err) return done(err);
          if (!model) return done(new Error('Content record dont exists'));

          done();
        });
      }
    }
  }

  return model;
}