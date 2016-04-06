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
      // show in this path
      path: { type: we.db.Sequelize.TEXT },
      // show only in this model
      modelName: { type: we.db.Sequelize.STRING, },
      modelId: { type: we.db.Sequelize.BIGINT, allowNull: true },
      // only show in record
      inRecord: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: null,
        allowNull: true
      },

      layout: {
        type:  we.db.Sequelize.STRING,
        defaultValue: 'default'
      },
      regionName: { type: we.db.Sequelize.STRING },
      // null || group-[id] || ceonference-[id]
      context: { type: we.db.Sequelize.STRING },
      theme: {
        type:  we.db.Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      },
      weight: {
        type: we.db.Sequelize.FLOAT,
        defaultValue: 0
      },
      configuration: {
        type: we.db.Sequelize.TEXT('medium'),
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
              if (this.getDataValue('inRecord')) {
                return 'in-session-record';
              } else {
                return 'in-session';
              }
            }
          } else if(this.getDataValue('path')) {
            return 'in-page';
          } else if (this.getDataValue('context')) {
            return 'in-context';
          }
          return 'in-portal';
        }
      },
      html: { type: we.db.Sequelize.VIRTUAL }
    },
    options: {
      enableAlias: false,

      instanceMethods: {
        getUrlPath: function() { return null; },
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