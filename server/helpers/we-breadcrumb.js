/**
 * We {{{we-breadcrumb}}}  helper
 *
 * usage:  {{{we-breadcrumb}}}
 */

module.exports = function(we) {
  return function breadcrumbHelper() {
    if (!this.breadcrumb) return '';

    if (typeof this.breadcrumb == 'string') {
      return new we.hbs.SafeString(this.breadcrumb);
    } else if (this.breadcrumb && this.req){
      return new we.hbs.SafeString(this.breadcrumb.render( this.req ));
    } else {
      return '';
    }
  }
}