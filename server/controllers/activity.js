/**
 * ActivityController.js
 */

module.exports = {

  findGroupActivity: function(req, res, next) {
    var we = req.getWe();

    if (!res.locals.group) return next();

    res.locals.query.where.groupId = res.locals.group.id;

    res.locals.query.group = ['modelName', 'modelId'];

    we.db.models.activity.findAndCountAll(res.locals.query)
    .then(function(activities) {

      res.locals.metadata.count = activities.count;
      res.locals.record = activities.rows;

      res.ok();
    }).catch(res.serverError);
  }
};





