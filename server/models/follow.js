/**
 * Follow
 *
 * @module      :: Model
 * @description :: Flag how store things how users are following
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      /**
       * creator user id
       */
      userId: {
        type:  we.db.Sequelize.BIGINT,
        allowNull: false
      },

      /**
       * model name ex.: post
       */
      model: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },

      /**
       * mode id ex.: post.id
       */
      modelId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      }
    },

    options: {
      classMethods: {
        /**
         * Get query to check if user is following
         *
         * @return {object} waterline findOne query object
         */
        isFollowing: function (userId, modelName, modelId){
          return we.db.models.follow.find({
            where: {
              userId: userId,
              model: modelName,
              modelId: modelId
            }
          });
        },

        /**
         * Check if one record or model type exists and returns it on callback
         */
        recordExists: function (modelName, modelId, cb) {
          if (!we.db.models[modelName])
            return cb('Model type dont exist.');

          we.db.models[modelName].find(modelId).done(cb);
        },

        getUsersFollowing: function(modelName, modelId) {
          return we.db.models.follow.find({
            where: {
              model: modelName,
              modelId: modelId
            }
          })
        }
      }
    }
  }
  return model;
}
