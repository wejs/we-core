/**
 * String localization with node i18n
 *
 * usage:  {{t 'string'}}
 *
 * @return {[type]} [description]
 */
module.exports = function(we) {
  return function t(string, attr) {
    if (!string) return '';
    if (typeof string === 'string') {
      if (this.__) {
        return this.__(string);
      } else {
        we.log.verbose('helper:t: this.__ not found, i will use we.i18n__')
        return we.i18n.__(string);
      }
    } else {
      if (this.__) {
        return this.__(string[attr]);
      } else {
        we.log.verbose('helper:t: this.__ not found, i will use we.i18n__')
        return we.i18n.__(string[attr]);
      }
    }
  }
}