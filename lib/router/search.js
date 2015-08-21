/**
 * Route search parsers and targets
 */

module.exports = {
  parsers: {
    equal: function(fieldName, field, value, w) {
      return w[fieldName] = value;
    },
    contains: function(fieldName, field, value, w) {
      return w[fieldName] = {
        $like : '%'+value+'%'
      }
    }
  },
  targets: {
    field: function(fieldName, field, value, query, req) {
      req.we.router.search.parsers[field.parser](fieldName, field, value, query.where);
    },
    association: function(fieldName, field, value, query, req) {
      for (var i = 0; i < query.include.length; i++) {
        if (query.include[i]) {
          if (!query.include[i].where) query.include[i].where = {};
          req.we.router.search.parsers[field.parser](fieldName, field, value, query.include[i].where);
          break;
        }
      }
    }
  }
}