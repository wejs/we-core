/**
 * We date formater helper
 *
 * usage:  {{we-date date format locals=locals}}
 */
var moment = require('moment');

module.exports = function(we) {
  return function datehelper(date, format) {
    if (!date) return '';
    var options = arguments[arguments.length-1];


    var d = moment(date);
    if (!d.isValid()) return '';

    var req;

    if (options.hash && options.hash.locals) {
      req = options.hash.locals.req;
    } else if (options.data.root.req) {
      req = options.data.root.req;
    } else {
      req = options.data.root.locals.req;
    }

    if (req && req.user) d.locale(req.user.language);

    if (format && typeof format === 'string') {
      return d.format(format);
    } else {
      return d.format(we.config.date.defaultFormat);
    }
  }
}