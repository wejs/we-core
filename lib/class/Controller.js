/**
 * We.js controller class
 */
var _ = require('lodash');

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
  return res.locals.Model.findAndCountAll(res.locals.query)
  .then(function (record) {
    if (!record) return next();

    res.locals.metadata.count = record.count;
    res.locals.record = record.rows;

    return res.ok();
  });
}

Controller.prototype.create = function create(req, res) {
  var we = req.getWe();

  req.body.creatorId = req.user.id;

  return res.locals.Model.create(req.body)
  .then(function (record) {
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

/**
 * Default findOne action
 *
 * Record is preloaded in context by default
 */
Controller.prototype.findOne = function findOne(req, res, next) {
  var we = req.getWe();

  if (!res.locals.record) return next();

  we.hooks.trigger('we:after:send:ok:response', {
    res: res,
    req: req
  }, function (err) {
    if (err) return res.serverError(err);
    return res.ok();
  });
};

Controller.prototype.update = function update(req, res) {
  var id = req.params.id;

  res.locals.Model.findById(id)
  .then(function (record) {
    if (!record) return res.notFound();

    record.updateAttributes(req.body)
    .then(function() {
      res.locals.record = record;
      return res.ok();
    });
  });
};

Controller.prototype.destroy = function destroy(req, res) {
  var id = req.params.id;

  res.locals.Model.findById(id)
  .then(function (record) {
    if (!record) return res.notFound();

    record.destroy(req.body)
    .then(function() {
      return res.deleted();
    });
  });
};

Controller.prototype.createPage = function createPage(req, res, next) {
  if (!res.locals.template)
    res.locals.template = res.locals.model + '/' + 'createPage.hbs';

  if (req.method === 'POST') {

    req.body.creatorId = req.user.id;

    res.locals.record = req.query;
    _.merge(res.locals.record, req.body);

    return res.locals.Model.create(req.body)
    .then(function (record) {
      return res.redirect('/' + res.locals.model + '/' +record.id);
    }).catch(res.queryError);
  } else {
    res.locals.record = req.query;

    res.responseMethod = 'ok';
    next();
  }
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