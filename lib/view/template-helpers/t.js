/**
 * String localization with node i18n
 *
 * usage:  {{t 'string'}}
 *
 * @return {[type]} [description]
 */
module.exports = function(we) {
  return function t(string, options) {
    if (!string) return '';

    if (this.__) {
      return this.__(string);
    } else {
      we.log.verbose('helper:t: this.__ not found, i will use we.i18n__')
      return we.i18n.__(this, options);
    }
  }
}