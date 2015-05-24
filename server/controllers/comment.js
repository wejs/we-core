/**
 * CommentController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  create: function (req, res) {
    var comment = req.body;
    if (req.user) comment.creatorId = req.user.id;

    res.locals.Model.create(comment)
    .then(function (newInstance) {
      res.created(newInstance);
    });
  },

  findOne: function (req, res) {
    if (!res.locals.record) return res.notFound();
    res.ok();
  },

  find: function findRecords (req, res) {
    var modelName = req.query.modelName;
    var modelId = req.query.modelId;

    res.locals.query.where.modelName = modelName;
    res.locals.query.where.modelId = modelId;

    res.locals.Model.findAll(res.locals.query)
    .then(function(comments) {
      return res.ok(comments);
    })
  },

  add: function (req, res) { return res.notFound(); },
  remove: function (req, res) { return res.notFound(); }
};
