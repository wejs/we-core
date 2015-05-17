/**
 * String localization with node i18n
 *
 * usage:  {{t 'string'}}
 *
 * @return {[type]} [description]
 */
module.exports = function() {
  return function t(string) {
    return this.__(string);
  }
}