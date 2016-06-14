'use strict';

var _lodash = require('lodash');

/**
 * Constructor
 */
function Controller(attrs) {
  for (var attr in attrs) {
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
/**
 * We.js default controller prototype
 *
 * All controllers is instance of this Controller prototype and have all actions defined here
 */

Controller.prototype.find = function findAll(req, res) {
  return res.locals.Model.findAndCountAll(res.locals.query).then(function afterFindAndCount(record) {
    res.locals.metadata.count = record.count;
    res.locals.data = record.rows;
    res.ok();
  }).catch(res.queryError);
};

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
  res.ok();
};

/**
 * Create and create page actions
 *
 * @param  {Object} req express.js request
 * @param  {Object} res express.js response
 */
Controller.prototype.create = function create(req, res) {
  console.log('>>', req.headers);
  if (req.isAuthenticated && req.isAuthenticated()) req.body.data.creatorId = req.user.id;

  if (!req.body.data || !req.body.data.attributes) return res.badRequest('we-core:ControllerJSONApi:req.body.data.attributes is required for create record');

  return res.locals.Model.create(req.body).then(function afterCreate(record) {
    res.locals.data = record;
    res.created();
  }).catch(res.queryError);
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
  var record = res.locals.data;

  if (!record) return res.notFound();

  if (!req.body.data || !req.body.data.attributes) return res.badRequest('we-core:ControllerJSONApi:req.body.data.attributes is required for update record');

  record.updateAttributes(req.body.data.attributes).then(function afterUpdate() {
    res.locals.data = record;
    res.updated();
  }).catch(res.queryError);
};

/**
 * Delete and delete action
 *
 * @param  {Object} req express.js request
 * @param  {Object} res express.js response
 */
Controller.prototype.delete = function deletePage(req, res) {
  var record = res.locals.data;
  if (!record) return res.notFound();

  res.locals.deleteMsg = res.locals.model + '.delete.confirm.msg';

  record.destroy().then(function afterDestroy() {
    res.locals.deleted = true;
    res.deleted();
  }).catch(res.queryError);
};

module.exports = Controller;