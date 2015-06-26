/**
 * We date formater helper
 *
 * usage:  {{we-date date format}}
 */
var moment = require('moment');

module.exports = function(we) {
  return function renderDate(date, format) {
    if (format && typeof format === 'string') {
      return moment(date).format(format);
    } else {
      return moment(date).format(we.config.date.defaultFormat);
    }
  }
}