/**
 * Post
 *
 * @module      :: Model
 * @description :: Post model
 *
 */

var S = require('string');

module.exports = function Model(we) {
  var model = {
    definition: {
      active:{
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: true
      },
      // post content
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

      objectType: {
        type: we.db.Sequelize.STRING
      }
    },

    associations: {
      creator:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'posts'
      },

      wembed:  {
        type: 'belongsTo',
        model: 'wembed',
        inverse: 'inPost'
      },

      images: {
        type: 'belongsToMany',
        model: 'image',
        via: 'inPost',
        through: 'post_images'
      }
    },

    hooks: {
      beforeCreate: function(post, options, next) {
        var originalBody = post.body;
        // sanitize
        we.sanitizer.sanitizeAllAttr(post);
        // create one tag clean text version
        post.bodyClean = S(originalBody).stripTags().s;
        // small teaser text
        post.bodyTeaser = post.bodyClean.substr(0, 30);
        next(null, post);
      },

      beforeUpdate: function(post, options, next) {
        var originalBody = post.body;
        // dont update post.comments in post.update
        delete post.comments;
        // sanitize
        we.sanitizer.sanitizeAllAttr(post);
        // create one tag clean text version
        post.bodyClean = S(originalBody).stripTags().s;
        // small teaser text
        post.bodyTeaser = post.bodyClean.substr(0, 30);
        next(null, post);
      }
    }
  }

  return model;
}