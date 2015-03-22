var url = {};

url.generate = function(req, res, record, cb) {
  var we = req.getWe();

  if (!req.body.url) {
    return cb();
  }

  var url = req.body.url;

  var data = {
    url: url,
    modelName: res.locals.model,
    modelId: record.id
  };

  if (req.user) {
    data.creatorId = req.user.id;
  }

  we.db.models.url.create(data).done(function(err, url) {
    if (err) return cb(err);

    res.locals.metadata.url = url;
    return cb(null, url);
  });
}

url.middleware = function urlMiddleware(req, res, next) {
  var we = req.getWe();

  var url = req.url;

  we.db.models.url.find({
    where: { url: url}
  }).done(function(err, url ){
    if (err) return res.serverError(err);
    if (!url) return next();

    // set some context vars
    res.locals.model = url.modelName;
    req.params.id = url.modelId;
    res.locals.Model = we.db.models[ url.modelName ];
    res.locals.action = 'findOne';
    res.locals.controller = url.modelName;

    // run context loader
    we.router.contextLoader(req, res, function(err) {
      if (err) return next(err);

      if (we.controllers[ url.modelName ] && we.controllers[ url.modelName ].findOne) {
        return we.controllers[ url.modelName ] && we.controllers[ url.modelName ].findOne(req, res, next);
      }

      return we.defaultController.findOne(req, res, next);
    })
  })

}

module.exports = url;