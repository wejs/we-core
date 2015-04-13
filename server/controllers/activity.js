/**
 * ActivityController.js
 */

module.exports = {
  create: function(req, res) { return res.notFound(); },
  update: function(req, res) {  return res.notFound(); },
  delete: function(req, res) {  return res.notFound(); },

  findGroupActivity: function(req, res, next) {
    var we = req.getWe();

    if (!res.locals.group) return next();

    res.locals.query.where.groupId = res.locals.group.id;

    res.locals.query.group = ['modelName', 'modelId'];

    we.db.models.activity.findAll(res.locals.query)
    .then(function(activities) {

      res.locals.metadata.count = activities.count;
      res.locals.record = activities;

      res.ok();
    }).catch(res.serverError);
  }
};





