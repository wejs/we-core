/**
 * We.js default controller prototype
 *
 * All controllers is instance of this Controller prototype and have all actions defined here
 */
const _ = require('lodash');

/**
 * Constructor
 */
function Controller (attrs) {
  for (let attr in attrs) {
    if (attrs[attr].bind) {
      this[attr] = attrs[attr].bind(this);
    } else {
      this[attr] = attrs[attr];
    }
  }
}

Controller.prototype = {
  /**
   * Default find action
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  find(req, res) {
    return res.locals.Model
    .findAndCountAll(res.locals.query)
    .then(function afterFindAndCount (record) {
      res.locals.metadata.count = record.count;
      res.locals.data = record.rows;
      res.ok();
    })
    .catch(res.queryError);
  },

  /**
   * Default count action
   *
   * Built for only send count as JSON
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  count(req, res) {
    return res.locals.Model
    .count(res.locals.query)
    .then( (count)=> {
      res.status(200).send({ count: count });
    })
    .catch(res.queryError);
  },
  /**
   * Default findOne action
   *
   * Record is preloaded in context loader by default and is avaible as res.locals.data
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  findOne(req, res, next) {
    if (!res.locals.data) {
      return next();
    }
    // by default record is preloaded in context load
    res.ok();
  },
  /**
   * Create and create page actions
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  create(req, res) {
    if (!res.locals.template) {
      res.locals.template = res.locals.model + '/' + 'create';
    }

    if (!res.locals.data) {
      res.locals.data = {};
    }

    if (req.method === 'POST') {
      if (req.isAuthenticated && req.isAuthenticated()) {
        req.body.creatorId = req.user.id;
      }

      _.merge(res.locals.data, req.body);

      return res.locals.Model
      .create(req.body)
      .then(function afterCreate (record) {
        res.locals.data = record;
        res.created();
      })
      .catch(res.queryError);
    } else {
      res.ok();
    }
  },
  /**
   * Edit, edit page and update action
   *
   * Record is preloaded in context loader by default and is avaible as res.locals.data
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  edit(req, res) {
    if (!res.locals.template) {
      res.locals.template = res.local.model + '/' + 'edit';
    }

    let record = res.locals.data;

    if (req.we.config.updateMethods.indexOf(req.method) >-1) {
      if (!record) {
        return res.notFound();
      }

      record.update(req.body)
      .then(function reloadAssocs(n) {
        return n.reload()
        .then(function() {
          return n;
        });
      })
      .then(function afterUpdate (newRecord) {
        res.locals.data = newRecord;
        res.updated();
      })
      .catch(res.queryError);
    } else {
      res.ok();
    }
  },
  /**
   * Delete and delete action
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  delete(req, res) {
    if (!res.locals.template) {
      res.locals.template = res.local.model + '/' + 'delete';
    }

    let record = res.locals.data;

    if (!record) {
      return res.notFound();
    }

    res.locals.deleteMsg = res.locals.model + '.delete.confirm.msg';

    if (req.method === 'POST' || req.method === 'DELETE') {
      record
      .destroy()
      .then(function afterDestroy () {
        res.locals.deleted = true;
        res.deleted();
      })
      .catch(res.queryError);
    } else {
      res.ok();
    }
  }
};

module.exports = Controller;
