/**
 * Comment Model
 *
 * @module      :: Model
 * @description :: Comment model
 *
 */

var S = require('string');

module.exports = function Model(we) {
  // set sequelize model define and options
  var model = {
    definition: {

      title: {
        type: we.db.Sequelize.TEXT
      },

      published: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: true
      },

      body: {
        type: we.db.Sequelize.TEXT,
        allowNull: false
      },

      // body without tags
      bodyClean: {
        type: we.db.Sequelize.TEXT
      },

      // body small body text version or description
      bodyTeaser: {
        type: we.db.Sequelize.TEXT
      },

      modelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },

      modelId: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      }
    },

    associations: {
      creator:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'comments'
      }
    },

    options: {
      classMethods: {
        // methods
        // TODO
        getCommentsAndCount: function(postId, callback){
          Comment.count()
          .where({
            post: postId
          }).exec(function(err, commentCount){
            if (err) return callback(err);

            Comment.find()
            .sort('updatedAt DESC')
            .limit(defaultCommentLimit)
            .where({
              post: postId
            }).exec(function(err, comments){
              if (err) return callback(err);

              return callback(null, comments, commentCount);
            });
          });
        }

      },
      instanceMethods: {},
      hooks: {
        validate: function(record, options, next) {
          if( !we.db.models[record.modelName] ) return next('modelName.required');

          we.db.models[record.modelName].find(record.modelId)
          .done(function (err, commentedRecord) {
            if(err) return next(err);
            if(!commentedRecord) return next('modelId.required');

            return next();
          });
        },

        beforeCreate: function(record, options, next) {
          var originalBody = record.body;
          // sanitize
          we.sanitizer.sanitizeAllAttr(record);
          // save a boy version without all tags
          record.bodyClean = S(originalBody).stripTags().s;
          // small teaser text
          record.bodyTeaser = record.bodyClean.substr(0, 100);
          next(null, record);
        },

        beforeUpdate: function(record, options, next) {
          var originalBody = record.body;
          // sanitize
          we.sanitizer.sanitizeAllAttr(record);
          // save a boy version without all tags
          record.bodyClean = S(originalBody).stripTags().s;
          // small teaser text
          record.bodyTeaser = record.bodyClean.substr(0, 100);
          next(null, record);
        },

      }
    }
  }

  return model;
}
