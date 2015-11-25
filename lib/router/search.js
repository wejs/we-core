/**
 * Route search parsers and targets
 */

function dateToDateTime(d) {
  var date = new Date(d);
  return date.getUTCFullYear() + '-' +
    ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
    ('00' + date.getUTCDate()).slice(-2) + ' ' +
    ('00' + date.getUTCHours()).slice(-2) + ':' +
    ('00' + date.getUTCMinutes()).slice(-2) + ':' +
    ('00' + date.getUTCSeconds()).slice(-2);
}

module.exports = {
  parsers: {
    equalBoolean: function(searchName, field, value, w) {
      if (!value || value.toLowerCase() === 'false') {
        return w[field.target.field] =  false;
      } else {
        return w[field.target.field] =  true;
      }
    },
    equal: function(searchName, field, value, w) {
      return w[field.target.field] = value;
    },
    contains: function(searchName, field, value, w) {
      return w[field.target.field] = {
        $like : '%'+value+'%'
      }
    },
    startsWith: function(searchName, field, value, w) {
      return w[field.target.field] = {
        $like : value+'%'
      }
    },
    userSearchQuery: function(searchName, field, value, w) {
      return w.$or = {
        email: {
          $eq: value
        },
        displayName: {
          $like: value+'%'
        },
        username: {
          $eq: value
        }
      }
    },
    since: function(searchName, field, value, w) {
      if (!value) return w;

      return w[field.target.field] = {
        $gt: dateToDateTime(value)
      }
    },

    // if user from :userId is
    paramIs: function(searchName, field, value, w, req) {
      return w[field.target.field] = req.params[field.param];
    }
  },
  targets: {
    field: function(searchName, field, value, query, req) {
      req.we.router.search.parsers[field.parser](searchName, field, value, query.where, req);
    },
    association: function(searchName, field, value, query, req) {
      for (var i = 0; i < query.include.length; i++) {
        if (query.include[i]) {
          if (!query.include[i].where) query.include[i].where = {};
          req.we.router.search.parsers[field.parser](searchName, field, value, query.include[i].where, req);
          break;
        }
      }
    }
  }
}