/**
 * Post
 *
 * @module      :: Model
 * @description :: Post model
 *
 */

var S = require('string');
var _ = require('lodash');

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




// module.exports = {

//   //-- Lifecycle Callbacks

//   beforeCreate: function(post, next) {
//     var originalBody = post.body;
//     // sanitize
//     post = SanitizeHtmlService.sanitizeAllAttr(post);
//     // create one tag clean text version
//     post.bodyClean = S(originalBody).stripTags().s;
//     // small teaser text
//     post.bodyTeaser = post.bodyClean.substr(0, 30);
//     next();
//   },

//   beforeUpdate: function(post, next) {
//     // dont update post.comments in post.update
//     delete post.comments;
//     // sanitize
//     post = SanitizeHtmlService.sanitizeAllAttr(post);
//     next();
//   },

//   loadPostImageAndComments: function (post, callback){
//     Post.findOne({id: post.id})
//     .populate('images')
//     .populate('sharedIn')
//     //.populate('comments', { limit: 2, sort: 'createdAt asc' })
//     .exec( function( err, postPopulated){
//       if(err){
//         sails.log.error('erro on find and populate post', err, post);
//         callback(err);
//       }

//       //fetch metadata and some comments for every post
//       Comment.getCommentsAndCount(postPopulated.id, function(err, comments, commentCount){
//         if (err) {
//           sails.log.error('loadPostImageAndComments:error on Comment.getCommentsAndCount', err,postPopulated);
//           return callback(err, postPopulated);
//         }

//         postPopulated.meta = {};
//         postPopulated.meta.commentCount = commentCount;
//         postPopulated._comments = [];

//         postPopulated._comments = comments.reverse();

//         callback(err, postPopulated);

//       });
//     })
//   }
// };
