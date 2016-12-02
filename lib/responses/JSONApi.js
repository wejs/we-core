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

      if (res.locals.action == 'find' || (0, _lodash.isArray)(res.locals.data)) {
        response = JSONApi.formatList(req, res);
      } else if (res.locals.action == 'delete') {
        // dont send data in delete
        response = {};
      } else {
        response = JSONApi.formatItem(req, res);
      }
    }

    response.meta = res.locals.metadata || {};

    // parse we.js errors to jsonapi errors
    JSONApi.parseErrors(response, req, res);

    res.send(response);
  },

  formatList: function formatList(req, res) {
    var data = [],
        r = {};

    // skip if data is empty
    if (!res.locals.data) return { data: [] };

    data = res.locals.data.map(function (d) {
      return d.toJSONAPI();
    });

    r.data = data;

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

    // associations:
    mc.associationNames.forEach(function (a) {
      if (!d[a]) return;
      if ((0, _lodash.isArray)(d[a])) {
        // parse hasMany and BelongsToMany
        JSONApi.parseNxNAssociation(mc, a, d[a], relationships, included, req.we);
        return;
      } else {
        // parse belongsTo and hasOne
        JSONApi.parse1xNAssociation(mc, a, d[a], relationships, included, req.we);
      }
    });

    r.data = {
      type: res.locals.model,
      id: d.id,
      attributes: attributes,
      relationships: relationships
    };

    if (req.we.config.JSONApi.sendSubRecordAttributes && included) {
      r.included = Object.keys(included).map(function (iid) {
        if (included[iid].attributes) {
          delete included[iid].attributes.id; // remove the id from attributes
        }
        return included[iid];
      });
    }

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

      if (req.body.data.relationships) {
        JSONApi.jsonAPIParseAssoc(req, res, context);
      }
    }

    return req.body;
  },

  jsonAPIParseAssoc: function jsonAPIParseAssoc(req, res, context) {
    var associations = req.we.db.models[context.config.model].associations;
    for (var assocName in associations) {
      if (req.body.data.relationships[assocName] && req.body.data.relationships[assocName].data) {
        switch (associations[assocName].associationType) {
          case 'BelongsTo':
            req.body[assocName + 'Id'] = req.body.data.relationships[assocName].data.id;
            break;
          case 'HasMany':
          case 'BelongsToMany':
            if (req.body.data.relationships[assocName].data.map) {
              req.body[assocName] = req.body.data.relationships[assocName].data.map(function (d) {
                return d.id;
              });
            }
            break;
        }
      }
    }
  },

  parse1xNAssociation: function parse1xNAssociation(mc, attrN, items, relationships, included, we) {
    if (items.toJSON) items = items.toJSON();

    var iid = mc.associations[attrN].model + '_' + items.id;

    if (we.config.JSONApi.sendSubRecordAttributes && !included[iid]) {
      included[iid] = {
        type: mc.associations[attrN].model,
        id: items.id
      };

      included[iid].attributes = items;
    }

    relationships[attrN] = {
      data: {
        id: items.id,
        type: mc.associations[attrN].model
      }
    };
  },

  parseNxNAssociation: function parseNxNAssociation(mc, attrN, items, relationships, included, we) {
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
      // skyp if record already in included
      if (we.config.JSONApi.sendSubRecordAttributes && !included[iid]) {
        included[iid] = {
          type: modelName,
          id: item.id
        };
        included[iid].attributes = item;
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
            errors.push(req.we.utils._.merge({
              status: res.statusCode,
              title: m.message
            }, m.extraData));
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