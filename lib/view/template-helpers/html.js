var hbs = require('hbs')

module.exports = function() {
  return function html(value) {
    if (!value || typeof value != 'string') return '';
    return new hbs.SafeString(value);
  }
}