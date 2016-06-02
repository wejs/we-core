/**
 * We.js default controller prototype
 *
 * All controllers is instance of this Controller prototype and have all actions defined here
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
 * Default find action
 *
 * @param  {Object} req express.js request
 * @param  {Object} res express.js response
 */
Controller.prototype.find = function findAll(req, res) {
  return res.locals.Model.findAndCountAll(res.locals.query)
  .then(function (record) {
    res.locals.metadata.count = record.count;
    res.locals.data = record.rows;
    return res.ok();
  }).catch(res.queryError);
}

/**
 * Default findOne action
 *
 * Record is preloaded in context loader by default and is avaible as res.locals.data
 *
 * @param  {Object} req express.js request
 * @param  {Object} res express.js response
 */
Controller.prototype.findOne = function findOne(req, res, next) {
  if (!res.locals.data) return next();
  return res.ok();
};

/**
 * Create and create page actions
 *
 * @param  {Object} req express.js request
 * @param  {Object} res express.js response
 */
Controller.prototype.create = function create(req, res) {
  if (!res.locals.template) res.locals.template = res.locals.model + '/' + 'create';

  if (!res.locals.data) res.locals.data = {};

  if (req.method === 'POST') {
    if (req.isAuthenticated && req.isAuthenticated())
      req.body.creatorId = req.user.id;

    _.merge(res.locals.data, req.body);

    return res.locals.Model.create(req.body)
    .then(function (record) {
      res.locals.data = record;
      res.created();
    }).catch(res.queryError);
  } else {
    res.ok();
  }
};

/**
 * Edit, edit page and update action
 *
 * Record is preloaded in context loader by default and is avaible as res.locals.data
 *
 * @param  {Object} req express.js request
 * @param  {Object} res express.js response
 */
Controller.prototype.edit = function edit(req, res) {
  if (!res.locals.template) res.locals.template = res.local.model + '/' + 'edit';

  var record = res.locals.data;

  if (req.we.config.updateMethods.indexOf(req.method) >-1) {
    if (!record) return res.notFound();

    record.updateAttributes(req.body)
    .then(function() {
      res.locals.data = record;
      return res.updated();
    }).catch(res.queryError);
  } else {
    res.ok();
  }
};

/**
 * Delete and delete action
 *
 * @param  {Object} req express.js request
 * @param  {Object} res express.js response
 */
Controller.prototype.delete = function deletePage(req, res) {
  if (!res.locals.template)
    res.locals.template = res.local.model + '/' + 'delete';

  var record = res.locals.data;
  if (!record) return res.notFound();

  res.locals.deleteMsg = res.locals.model+'.delete.confirm.msg';

  if (req.method === 'POST' || req.method === 'DELETE') {
    record.destroy().then(function() {
      res.locals.deleted = true;
      return res.deleted();
    }).catch(res.queryError);
  } else {
    return res.ok();
  }
}

// TODO
//
// Controller.prototype.getAttribute = function getAttribute(req, res, next) {
//   console.log('TODO');  next();
// };

// Controller.prototype.updateAttribute = function(req, res, next) {
//   console.log('TODO');  next();
// };

// Controller.prototype.deleteAttribute = function(req, res, next) {
//   console.log('TODO');  next();
// };

// Controller.prototype.addRecord = function(req, res, next) {
//   console.log('TODO');  next();
// };

// Controller.prototype.removeRecord = function(req, res, next) {
//   console.log('TODO');  next();
// };

// Controller.prototype.getRecord = function(req, res, next) {
//   console.log('TODO');  next();
// };

module.exports = Controller;
