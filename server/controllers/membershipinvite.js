
module.exports = {
  find: function findAll(req, res, next) {
    res.locals.query.groupId = req.params.groupId;

    res.locals.Model.findAndCountAll(res.locals.query, res.locals.queryOptions)
    .done(function(err, record) {
      if (err) return res.serverError(err);
      if (!record) return next();

      res.locals.metadata.count = record.count;
      res.locals.record = record.rows;

      return res.ok();
    });
  }

};