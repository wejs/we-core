/**
 * We {{we-breadcrumb}}  helper
 *
 * usage:  {{we-breadcrumb locals=locals}}
 */

module.exports = function(we) {
  return function helper() {
    var options = arguments[arguments.length-1];
    var html = '', links, i;

    if (!options.hash.locals) return '';

    if (typeof options.hash.locals.breadcrumb == 'string') {
      if (!we.router.breadcrumb[options.hash.locals.breadcrumb])
        return '';

      html += '<ol class="breadcrumb">';

      links = we.router.breadcrumb[options.hash.locals.breadcrumb]
        .bind(options.hash.locals)();

      for (i = 0; i < links.length; i++) {
        // set last link as active
        if (i == links.length) {
          html +=  '<li>';
        } else {
          html +=  '<li class="active">';
        }

        html += '<a href="'+links[i].href+'">'+links[i].text+'</a></li>';
      }

      html += '</ol>';
    } else if (typeof options.hash.locals.breadcrumb == 'function') {
      html += '<ol class="breadcrumb">';

      links = options.hash.locals.breadcrumb();
      for (i = 0; i < links.length; i++) {
        // set last link as active
        if (i == links.length) {
          html +=  '<li>';
        } else {
          html +=  '<li class="active">';
        }

        html += '<a href="'+links[i].href+'">'+links[i].text+'</a></li>';
      }

      html += '</ol>';
    }

    // if you return hTML use the:
    return new we.hbs.SafeString(html);
  }
}