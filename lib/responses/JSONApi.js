'use strict';

var _lodash = require('lodash');

var actions = ['edit', 'create'];

var JSONApi = {
  jsonAPIFormater: function jsonAPIFormater(req, res) {
    var response = {};

    if (res.locals.model) {
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
    }

    response.meta = res.locals.metadata || {};

    // parse we.js errors to jsonapi errors
    JSONApi.parseErrors(response, req, res);

    res.send(response);
  },

  formatList: function formatList(req, res) {
    var data = [],
        included = {},
        r = {},
        mc = req.we.db.modelsConfigs[res.locals.model];

    // skip if data is empty
    if (!res.locals.data) return { data: [] };

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
          // parse hasMany and BellongsToMany
          JSONApi.parseNxNAssociation(mc, a, d[a], relationships, included, req.we);
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

    // skip if data is empty
    if (!res.locals.data) return { data: [] };

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
        // parse hasMany and BellongsToMany
        JSONApi.parseNxNAssociation(mc, a, d[a], relationships, included, req.we);
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
      if (!req.body.data || !req.body.data.attributes) return req.body;
      // change json api body to default we.js controller body compatible with sequelize
      for (var attr in req.body.data.attributes) {
        req.body[attr] = req.body.data.attributes[attr];
      }
      // TODO parse req.body.data.relationships
      //
    }

    return req.body;
  },

  parseNxNAssociation: function parseNxNAssociation(mc, attrN, items, relationships, included) {
    var modelName = mc.associations[attrN].model;

    if (!relationships[attrN]) {
      relationships[attrN] = {
        data: []
      };
    }

    items.forEach(function (item) {

      relationships[attrN].data.push({
        id: item.id,
        type: modelName
      });

      var iid = modelName + '_' + item.id;
      // skyp if record alread in included
      if (included[iid]) return;

      if (!included[iid]) {
        included[iid] = {
          type: modelName,
          id: item.id,
          attributes: item
        };
      }
    });
  },

  /**
   * Format erros from res.locals.messages to jsonapi erros and set it in response
   */
  parseErrors: function parseErrors(response, req, res) {
    if (!response.meta.messages) response.meta.messages = [];

    if (res.locals.messages) {
      (function () {
        var errors = [];

        // first get and format all errros:
        res.locals.messages.forEach(function (m) {
          if (m.status == 'danger' || m.status == 'error') {
            errors.push({
              status: res.statusCode,
              title: m.message
            });
          } else {
            // others messages like success goes in meta object
            response.meta.messages.push(m);
          }
        });

        if (errors && errors.length) {
          response.errors = errors;
        }
      })();
    }
  }
};

module.exports = JSONApi;