/**
 * Route search parsers and targets
 */
const moment = require('moment'),
  Sequelize = require('sequelize'),
  Op = Sequelize.Op;

/**
 * Converts one date string to dateTime
 * @param  {string} d date
 * @return {string}   dateTime
 */
function dateToDateTime(d) {
  if (d) {
    let date = moment(d);
    // return null if not is valid
    if (!date.isValid()) return null;
    // return data in datetime format
    return date.format('YYYY-MM-DD HH:mm:ss');
  } else {
    return null;
  }
}

module.exports = {
  parsers: {
    equalBoolean(searchName, field, value, w) {
      if (!value || value.toLowerCase() === 'false') {
        return w[field.target.field] =  false;
      } else {
        return w[field.target.field] =  true;
      }
    },
    equal(searchName, field, value, w) {
      return w[field.target.field] = value;
    },
    contains(searchName, field, value, w) {
      return w[field.target.field] = {
        [Op.like]: '%'+value+'%'
      };
    },
    startsWith(searchName, field, value, w) {
      return w[field.target.field] = {
        [Op.like]: value+'%'
      };
    },
    userSearchQuery(searchName, field, value, w) {
      return w[Op.or] = {
        email: {
          [Op.eq]: value
        },
        displayName: {
          [Op.like]: value+'%'
        },
        username: {
          [Op.eq]: value
        }
      };
    },
    since(searchName, field, value, w) {
      if (!value) return w;

      return w[field.target.field] = {
        [Op.gt]: dateToDateTime(value)
      };
    },

    // if user from :userId is
    paramIs(searchName, field, value, w, req) {
      return w[field.target.field] = req.params[field.param];
    }
  },
  targets: {
    field(searchName, field, value, query, req) {
      req.we.router.search.parsers[field.parser](searchName, field, value, query.where, req);
    },
    association(searchName, field, value, query, req) {
      for (let i = 0; i < query.include.length; i++) {
        if (query.include[i]) {
          if (!query.include[i].where) query.include[i].where = {};
          req.we.router.search.parsers[field.parser](searchName, field, value, query.include[i].where, req);
          // required target configuration
          if (field.target.required) query.include[i].required = true;

          break;
        }
      }
    }
  }
};