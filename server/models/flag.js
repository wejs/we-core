/**
 * Flag
 *
 * @module      :: Model
 * @description :: Flag how store things how users are following
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      /**
       * type
       */
      flagType: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      /**
       * flag user id
       */
      userId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      },

      /**
       * flagged model name ex.: post
       */
      model: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },

      /**
       * flagged mode id ex.: post.id
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
        isFlagged: function checkIfisFlaggedDB(flagType ,userId, modelName, modelId){
          return we.db.models.flag.find({
            where: {
              flagType: flagType,
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
          var RelatedModel = we.db.models[modelName];
          if(!RelatedModel) {
            return cb('Model type dont exist.');
          }

          RelatedModel.findById(modelId)
          .then(function(r){ cb(null, r); })
          .catch(cb);
        }
      }
    }
  }

  return model;
}