/**
 * We time ago date formater helper
 *
 * usage:  {{we-time-ago date locals=locals}}
 */
var moment = require('moment');

module.exports = function() {
  return function datehelper(date) {
    if (!date) return '';
    var options = arguments[arguments.length-1];
    // get a instance of moment time ago
    var d = moment(date);
    // check if is valid
    if (!d.isValid()) return '';

    var req;
    // get req
    if (options.hash && options.hash.locals) {
      req = options.hash.locals.req;
    } else if (options.data.root.req) {
      req = options.data.root.req;
    } else {
      req = options.data.root.locals.req;
    }

    if (req && req.user) d.locale(req.user.language);

    return d.fromNow();
  }
}