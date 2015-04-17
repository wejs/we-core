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
    .done(function (err, newInstance) {
      if (err) return res.serverError(err);
      res.created(newInstance);
    });
  },

  findOne: function (req, res) {
    var we = req.getWe();

    if (!res.locals.record) return res.notFound();

    res.ok();
  },

  find: function findRecords (req, res) {
    var we = req.getWe();

    var modelName = req.query.modelName;
    var modelId = req.query.modelId;

    res.locals.query.where.modelName = modelName;
    res.locals.query.where.modelId = modelId;


    res.locals.Model.findAll(res.locals.query)
    .done(function(err, comments) {
      if(err) return res.serverError(err);

      return res.ok(comments);
    })
  },

  add: function (req, res) { return res.notFound(); },
  remove: function (req, res) { return res.notFound(); }
};
