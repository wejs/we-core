'use strict';

var _lodash = require('lodash');

var actions = ['edit', 'create'];

var JSONApi = {
  jsonAPIFormater: function jsonAPIFormater(req, res) {
    var response = void 0;

    if (!res.locals.model) {
      if (!res.locals.data) res.locals.data = {};
      // set messages
      res.locals.data.messages = res.locals.messages;
      return res.send(res.locals.data);
    }

    // check field privacity access for users
    if (res.locals.model == 'user') {
      req.we.db.checkRecordsPrivacity(res.locals.data);
    }

    if (res.locals.action == 'find') {
      response = JSONApi.formatList(req, res);
    } else if (res.locals.action == 'delete') {
      // dont send data in delete
      response = {};
    } else {
      response = JSONApi.formatItem(req, res);
      // formatItem (req, res, response)
    }

    response.meta = res.locals.metadata;

    if (!(0, _lodash.isEmpty)(res.locals.messages)) {
      // set messages
      response.meta.messages = res.locals.messages;
    }

    res.send(response);
  },

  formatList: function formatList(req, res) {
    var data = [],
        included = {},
        r = {},
        mc = req.we.db.modelsConfigs[res.locals.model];

    data = res.locals.data.map(function (d) {
      return d.toJSON();
    }).map(function (d) {

      var attributes = {};
      var relationships = {};

      // attributes
      mc.attributeList.forEach(function (a) {
        attributes[a] = d[a];
      });

      mc.associationNames.forEach(function (a) {
        if (!d[a]) return;

        if ((0, _lodash.isArray)(d[a])) {
          // TODO
          req.we.log.warn('JSONApi associations with hasMany and belongsToMany not is implemented');
          return;
        }

        if (d[a].toJSON) d[a] = d[a].toJSON();

        var iid = mc.associations[a].model + '_' + d[a].id;

        if (!included[iid]) {
          included[iid] = {
            type: mc.associations[a].model,
            id: d[a].id,
            attributes: d[a]
          };
        }

        relationships[a] = {
          data: {
            id: d[a].id,
            type: mc.associations[a].model
          }
        };
      });

      return {
        type: res.locals.model,
        id: d.id,
        attributes: attributes,
        relationships: relationships
      };
    });

    r.data = data;

    if (included) r.included = Object.keys(included).map(function (iid) {
      delete included[iid].attributes.id; // remove the id from attributes
      return included[iid];
    });

    return r;
  },
  formatItem: function formatItem(req, res) {
    var d = void 0,
        included = {},
        r = {},
        mc = req.we.db.modelsConfigs[res.locals.model];

    if (res.locals.data.toJSON) {
      d = res.locals.data.toJSON();
    } else {
      d = res.locals.data;
    }

    var attributes = {};
    var relationships = {};

    // attributes
    mc.attributeList.forEach(function (a) {
      attributes[a] = d[a];
    });

    mc.associationNames.forEach(function (a) {
      if (!d[a]) return;
      if ((0, _lodash.isArray)(d[a])) {
        // TODO
        req.we.log.warn('JSONApi associations with hasMany and belongsToMany not is implemented');
        return;
      }

      if (d[a].toJSON) d[a] = d[a].toJSON();

      var iid = mc.associations[a].model + '_' + d[a].id;

      if (!included[iid]) {
        included[iid] = {
          type: mc.associations[a].model,
          id: d[a].id,
          attributes: d[a]
        };
      }

      relationships[a] = {
        data: {
          id: d[a].id,
          type: mc.associations[a].model
        }
      };
    });

    r.data = {
      type: res.locals.model,
      id: d.id,
      attributes: attributes,
      relationships: relationships
    };

    if (included) r.included = Object.keys(included).map(function (iid) {
      delete included[iid].attributes.id; // remove the id from attributes
      return included[iid];
    });

    return r;
  },

  jsonAPIParser: function jsonAPIParser(req, res, context) {
    // create and update actions
    if (actions.indexOf(context.config.action) !== -1) {
      // atributes is required
      if (!req.body.attributes) return req.body;
      // change json api body to default we.js controller body compatible with sequelize
      for (var attr in req.body.attributes) {
        req.body[attr] = req.body.attributes[attr];
      }
      // TODO parse req.body.relationships
      //
    }
    return req.body;
  },

  crud: {
    create: function createRecordFromReq(req, Model, next) {
      Model.create(req.body.data.attributes).nodeify(next);
    }
  }
};

module.exports = JSONApi;