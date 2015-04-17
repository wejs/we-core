/**
 * We.js controller class
 */

/**
 * Constructor
 */
function Controller(attrs) {
  for(var attr in attrs) {
    if (attrs[attr].bind) {
      this[attr] = attrs[attr].bind(this);
    } else {
      this[attr] = attrs[attr];
    }
  }
}

/**
 * Default crud actions
 */
Controller.prototype.find = function findAll(req, res, next) {
  res.locals.Model.findAndCountAll(res.locals.query, res.locals.queryOptions)
  .done(function(err, record) {
    if (err) return res.serverError(err);
    if (!record) return next();

    res.locals.metadata.count = record.count;
    res.locals.record = record.rows;

    return res.ok();
  });
}

Controller.prototype.create = function create(req, res) {
  var we = req.getWe();

  req.body.creatorId = req.user.id;

  res.locals.Model.create(req.body)
  .done(function(err, record) {
    if (err) return res.serverError(err);
    // generate a unique url
    we.url.generate(req, res, record, function(err, url) {
      if (err) {
        we.log.error(err);
        res.addMessage('error', err);
      }

      res.locals.metadata.url = url;
      return res.created(record);
    })
  });
}

Controller.prototype.findOne = function findOne(req, res, next) {
  var we = req.getWe();
  var id = req.params.id;

  res.locals.Model.find({
    where: { id: id},
    include: [{ all: true,  attributes: ['id'] }]
  })
  .done(function(err, record) {
    if (err) return res.serverError(err);
    if (!record) return next();

    res.locals.record = record;

    we.hooks.trigger('we:after:send:ok:response', {
      res: res,
      req: req
    }, function() {
      return res.ok();
    });
  });
};

Controller.prototype.update = function update(req, res) {
  var id = req.params.id;

  res.locals.Model.find(id)
  .done(function(err, record) {
    if (err) return res.serverError(err);
    if (!record) return res.notFound();

    record.updateAttributes(req.body)
    .done(function(err) {
      if (err) return res.serverError(err);
      res.locals.record = record;
      return res.ok();
    });
  });
};

Controller.prototype.destroy = function destroy(req, res) {
  var id = req.params.id;

  res.locals.Model.find(id)
  .done(function(err, record) {
    if (err) return res.serverError(err);
    if (!record) return res.notFound();

    record.destroy(req.body)
    .done(function(err) {
      if (err) return res.serverError(err);
      return res.deleted();
    });
  });
};

Controller.prototype.editPage = function editPage(req, res, next) {
  console.log('TODO');  next();
};

Controller.prototype.getAttribute = function getAttribute(req, res, next) {
  console.log('TODO');  next();
};

Controller.prototype.updateAttribute = function(req, res, next) {
  console.log('TODO');  next();
};

Controller.prototype.deleteAttribute = function(req, res, next) {
  console.log('TODO');  next();
};

Controller.prototype.addRecord = function(req, res, next) {
  console.log('TODO');  next();
};

Controller.prototype.removeRecord = function(req, res, next) {
  console.log('TODO');  next();
};

Controller.prototype.getRecord = function(req, res, next) {
  console.log('TODO');  next();
};

module.exports = Controller;