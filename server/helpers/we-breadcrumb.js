/**
 * We {{{we-breadcrumb}}}  helper
 *
 * usage:  {{{we-breadcrumb}}}
 */

module.exports = function(we) {
  return function breadcrumbHelper() {
    return new we.hbs.SafeString(this.breadcrumb || '');
  }
}