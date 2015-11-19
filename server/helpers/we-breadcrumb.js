/**
 * We {{{we-breadcrumb}}}  helper
 *
 * usage:  {{{we-breadcrumb}}}
 */

module.exports = function() {
  return function breadcrumbHelper() {
    return this.breadcrumb || '';
  }
}