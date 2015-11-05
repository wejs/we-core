/**
 * We {{we-breadcrumb}}  helper
 *
 * usage:  {{we-breadcrumb locals=locals}}
 */

module.exports = function(we) {
  return function helper() {
    var options = arguments[arguments.length-1];
    var html = '';

    if (
      options.hash.locals &&
      typeof options.hash.locals.breadcrumb == 'function'
    ) {
      html += '<ol class="breadcrumb">';

      var links = options.hash.locals.breadcrumb();
      for (var i = 0; i < links.length; i++) {
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