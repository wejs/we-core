/**
 * Wembed  - page embed with wembed
 *
 * @module      :: Model
 * @description :: Wembed model
 *
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      // shared page url
      url: {
        type: we.db.Sequelize.STRING,
        allowNull: false,
      },

      wembedId: {
        type: we.db.Sequelize.STRING,
        allowNull: false,
      },
      // page domain
      domain: {
        type: we.db.Sequelize.STRING,
        allowNull: false,
      },
      // time how the page is scaned
      cacheTime: {
        type:  we.db.Sequelize.DATE,
        allowNull: false,
      },

      title: {
        type: we.db.Sequelize.STRING,
      },

      description: {
        type: we.db.Sequelize.TEXT,
      },

      // youtube, vimeo ... wikipedia
      provider: {
        type: we.db.Sequelize.STRING,
      },

      pageId: {
        type: we.db.Sequelize.STRING,
      },

      pageType: {
        type: we.db.Sequelize.STRING,
      },

      imageIndex: {
        type: we.db.Sequelize.INTEGER,
        defaultValue: 0
      },

      thumbnail: {
        type: we.db.Sequelize.STRING,
      },

      thumbnailMime: {
        type: we.db.Sequelize.STRING,
      }
    },

    associations: {
      creator:  {
        type: 'belongsTo',
        model: 'user',
        inverse: 'wembeds'
      },

      inPost:  {
        emberOnly: true,
        type: 'belongsTo',
        model: 'post',
        inverse: 'wembed'
      }
    }
  }

  return model;
}


// module.exports = {
//   schema: true,
//   attributes: {
//     // shared page url
//     url: {
//       type: 'string',
//       required: true
//     },

//     wembedId: {
//       type: 'string',
//       required: true
//     },
//     // page domain
//     domain: {
//       type: 'string',
//       required: true
//     },
//     // time how the page is scaned
//     cacheTime: {
//       type: 'date',
//       required: true
//     },

//     title: {
//       type: 'string'
//     },

//     description: {
//       type: 'string'
//     },

//     // youtube, vimeo ... wikipedia
//     provider: {
//       type: 'string'
//     },

//     pageId: {
//       type: 'string'
//     },

//     pageType: {
//       type: 'string'
//     },

//     imageIndex: {
//       type: 'integer',
//       defaultsTo: 0
//     },

//     thumbnail: {
//       type: 'string'
//     },

//     thumbnailMime: {
//       type: 'string'
//     },

//     creator: {
//       model: 'user',
//       required: true
//     }

//   }
// };
