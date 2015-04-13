/**
 * Avtivity
 *
 * @module      :: Model
 */

module.exports = function Model(we) {
  var model = {
    definition: {
      activityUID: {
        type: we.db.Sequelize.STRING
      },

      modelName: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      modelId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      },

      targetModelName: {
        type: we.db.Sequelize.STRING,
      },
      targetModelId: {
        type: we.db.Sequelize.BIGINT
      },

      groupId: {
        type: we.db.Sequelize.BIGINT
      },
      // user how did the activity
      actor: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      },
      action: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      }
    },

    associations: {},

    options: {
      classMethods: {},
      instanceMethods: {},
      hooks: {
        beforeCreate: function(record, options, done) {
          record.dataValues.activityUID = record.modelName +'_' + record.modelId;

          done(null, record);
        }
      }
    }
  }

  we.hooks.on('we:before:send:createdResponse', function registerActivity(data, done){

    if (!data.res.locals.model || !data.res.locals.record.id || !data.req.user.id || !data.res.locals.action) {
      return done();
    }

    var groupId = null;
    if (data.res.locals.group && data.res.locals.group.id) {
      groupId = data.res.locals.group.id;
    } else {
      if (data.res.locals.model == 'group') {
        groupId = data.req.params.id;
      }
    }

    we.db.models.activity.create({
      modelName: data.res.locals.model,
      modelId: data.res.locals.record.id,
      actor: data.req.user.id,
      action: data.res.locals.action,
      groupId: groupId
    }).then(function () {
      done();
    }).catch(function(err) {
      we.log.error('Error on create activity:', err);
      done(err);
    });
  });


  we.hooks.on('we:before:send:okResponse', function registerActivity(data, done){
    if (data.res.locals.action != 'update') return done();

    if (!data.res.locals.model || !data.req.params.id || !data.req.user.id) {
      return done();
    }

    var groupId = null;
    if (data.res.locals.group && data.res.locals.group.id) {
      groupId = data.res.locals.group.id;
    } else {
      if (data.res.locals.model == 'group') {
        groupId = data.req.params.id;
      }
    }

    we.db.models.activity.create({
      modelName: data.res.locals.model,
      modelId: data.req.params.id,
      actor: data.req.user.id,
      action: data.res.locals.action,
      groupId: groupId
    }).then(function () {
      done();
    }).catch(function(err) {
      we.log.error('Error on create activity:', err);
      done(err);
    });
  });

  we.hooks.on('we:before:send:deletedResponse', function deleteModelActivities(data, done){

    if (!data.res.locals.model || !data.req.params.id) {
      return done();
    }

    we.db.models.activity.destroy({
      where: {
        modelName: data.res.locals.model,
        modelId: data.req.params.id
      }
    }).then(function () {
      done();
    }).catch(function(err) {
      we.log.error('Error on delete activity:', err);
      done(err);
    });
  });

  we.hooks.on('we:before:send:group:addContent', function(data, done){
    var groupId = data.req.params.groupId;

    if (!data.res.locals.metadata.activity) data.res.locals.metadata.activity = [];
    if (!data.req.isAuthenticated()) return done();

    we.db.models.activity.create({
      modelName: data.req.params.contentModelName,
      modelId: data.req.params.contentId,
      actor: data.req.user.id,
      action: 'addContent',
      targetModelName: 'group',
      targetModelId: groupId,
      groupId: groupId
    }).then(function (ac) {
      data.res.locals.metadata.activity.push(ac);
      done();
    }).catch(function(err) {
      we.log.error('Error on create activity:', err);
      done(err);
    });
  });

  we.hooks.on('we:before:send:group:removeContent', function(data, done){
    var groupId = data.req.params.groupId;

    we.db.models.activity.destroy({
      where: {
        modelName: data.req.params.contentModelName,
        modelId: data.req.params.contentId,
        action: 'addContent',
        targetModelName: 'group',
        targetModelId: groupId,
        groupId: groupId
      }
    }).then(function () {
      done();
    }).catch(function(err) {
      we.log.error('Error on delete activity:', err);
      done(err);
    });
  });

  return model;
}