module.exports = function (we) {
  var model = {
    definition: {
      title: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      text: {
        type: we.db.Sequelize.TEXT
      },
    },
    associations: {
      creator: { type: 'belongsTo', model: 'user' },
      tags: {
        type: 'belongsToMany',
        model: 'tag',
        inverse: 'inPosts',
        through: 'posts_tags'
      }
    }
  };

  return model;
};