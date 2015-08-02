/**
 * Widget
 *
 * @module      :: Model
 * @description :: Store widget config
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      /**
       * creator user id
       */
      creatorId: { type:  we.db.Sequelize.BIGINT },
      title: { type:  we.db.Sequelize.STRING },
      subtitle: { type:  we.db.Sequelize.STRING },

      type: {
        type:  we.db.Sequelize.STRING,
        allowNull: false
      },
      // show only in this model
      modelName: { type: we.db.Sequelize.STRING, },
      modelId: { type: we.db.Sequelize.BIGINT },

      layout: {
        type:  we.db.Sequelize.STRING,
        defaultValue: 'default'
      },
      regionName: { type: we.db.Sequelize.STRING },
      // null || group-[id] || ceonference-[id]
      context: { type: we.db.Sequelize.STRING },
      theme: { type:  we.db.Sequelize.STRING, allowNull: false },
      weight: {
        type:  we.db.Sequelize.FLOAT,
        defaultValue: 0
      },
      configuration: {
        type:  we.db.Sequelize.TEXT,
        skipSanitizer: true,
        get: function()  {
          if (this.getDataValue('configuration'))
            return JSON.parse( this.getDataValue('configuration') );
          return {};
        },
        set: function(object) {
          if (typeof object == 'object') {
            this.setDataValue('configuration', JSON.stringify(object));
          } else {
            throw new Error('invalid error in widget configuration value: ', object);
          }
        }
      },

      visibility: {
        type: we.db.Sequelize.VIRTUAL,
        allowNull: true,
        get: function() {
          if (this.getDataValue('modelName')) {
            if (this.getDataValue('modelId')) {
              return 'in-page';
            } else {
              return 'in-session';
            }
          } else if (this.getDataValue('context')) {
            return 'in-context';
          }
          return 'in-portal';
        }
      }
    },
    options: {
      instanceMethods: {
        viewMiddleware: function viewMiddleware(req, res, next) {
          if (!we.view.widgets[this.type]) {
            we.log.warn('Widget type not found in viewMiddleware: ', this.type);
            return next();
          }

          return we.view.widgets[this.type].viewMiddleware(this, req, res, next);
        }
      }
    }
  }

  return model;
};