import { isArray } from 'lodash';
const actions = ['edit', 'create'];

let JSONApi = {
  jsonAPIFormater: function jsonAPIFormater (req, res) {
    let response = {};

    // check field privacity access for users
    if (res.locals.model == 'user') {
      req.we.db.checkRecordsPrivacity(res.locals.data);
    }

    if (res.locals.action == 'find' || isArray(res.locals.data) ) {
      response = JSONApi.formatList (req, res);
    } else if (res.locals.action == 'delete') {
      // dont send data in delete
      response = {};
    } else if (res.locals.model) {
      response = JSONApi.formatItem (req, res);
    }

    response.meta = res.locals.metadata || {};

    // parse we.js errors to jsonapi errors
    JSONApi.parseErrors(response, req, res);

    res.send(response);
  },

  formatList: function formatList (req, res) {
    let data = [],
        r = {};

    // skip if data is empty
    if (!res.locals.data) return { data: [] };

    data = res.locals.data
    .map(d => {
      if (d.toJSONAPI) {
        return d.toJSONAPI();
      } else {
        return d;
      }
    });

    r.data = data;

    return r;
  },

  formatItem: function formatItem (req, res) {
    // skip if data is empty
    if (!res.locals.data) return { data: [] };

    if (res.locals.data.toJSONAPI) {
      return { data: res.locals.data.toJSONAPI() };
    } else {
      return res.locals.data;
    }
  },

  jsonAPIParser: function jsonAPIParser (req, res, context) {
    // create and update actions
    if (actions.includes(context.config.action)) {
      // atributes is required
      if (!req.body.data || !req.body.data.attributes) return req.body
      // change json api body to default we.js controller body compatible with sequelize
      for (let attr in req.body.data.attributes) {
        req.body[attr] = req.body.data.attributes[attr]
      }

      if (req.body.data.relationships) {
        JSONApi.jsonAPIParseAssoc(req, res, context);
      }
    }

    return req.body
  },

  jsonAPIParseAssoc: function jsonAPIParseAssoc(req, res, context) {
    const associations = req.we.db.models[context.config.model].associations;
    for(let assocName in associations) {
      if (
        req.body.data.relationships[assocName] &&
        req.body.data.relationships[assocName].data
      ) {
        switch(associations[assocName].associationType) {
          case 'BelongsTo':
            req.body[ assocName+'Id' ] = req.body.data.relationships[assocName].data.id;
            break;
          case 'HasMany':
          case 'BelongsToMany':
            if (req.body.data.relationships[assocName].data.map) {
              req.body[ assocName ] = req.body.data.relationships[assocName].data.map(function(d) {
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

    let iid = mc.associations[attrN].model + '_' + items.id;

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

  parseNxNAssociation: function parseNxNAssociation (mc, attrN, items, relationships, included, we) {
    let modelName = mc.associations[attrN].model;

    if (!relationships[attrN]) {
      relationships[attrN] = {
        data: []
      };
    }

    items.forEach(item => {

      relationships[attrN].data.push({
        id: item.id,
        type: modelName
      });

      let iid = modelName + '_' + item.id;
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
  parseErrors: function parseErrors (response, req, res) {
    if (!response.meta.messages) response.meta.messages = [];

    if (res.locals.messages) {
      let errors = [];

      // first get and format all errros:
      res.locals.messages.forEach(m => {
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
    }
  }
};

module.exports = JSONApi;