module.exports = function (we) {
  var model = {
    definition: {
      displayName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      }
    },
    associations: {
      posts: {
        type: 'hasMany', model: 'post', inverse: 'creator'
      }
    }
  };

  return model;
};