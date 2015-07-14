/**
 * We date formater helper
 *
 * usage:  {{we-date date format}}
 */
var moment = require('moment');

module.exports = function(we) {
  return function renderDate(date, format) {
    if (!date) return '';
    var options = arguments[arguments.length-1];

    var d = moment(date);
    if (!d.isValid()) return '';

    var req = options.data.root.req;
    if (!req) req = this.locals.req;
    if (req && req.user) d.locale(req.user.language);

    if (format && typeof format === 'string') {
      return d.format(format);
    } else {
      return d.format(we.config.date.defaultFormat);
    }
  }
}