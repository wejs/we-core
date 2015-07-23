/**
 * We grid formater helper
 *
 * usage:  {{#we-grid items=array cols=colCount}}each item html{{/we-grid}}
 */
module.exports = function(we) {
  return function renderHelper() {
    var options = arguments[arguments.length-1];
    var items = options.hash.items;
    var cols = options.hash.cols || 3;
    // bootstrap col size
    var bsColSize = (parseInt(12/cols));

    var html = '';
    if (!items) return options.inverse(this);

    var rowInit = true;

    for (var i = 0; i < items.length; i++) {
      if (rowInit) {
        html += '<div class="row">';
        rowInit = false;
      }

      html += '<div class="col col-md-'+ bsColSize +'">';
        html += options.fn(items[i]);
      html += '</div>';

      if (i == (cols-1) ) {
        cols = cols*2;
        rowInit = true;

        html += '</div>';
      }
    }

    return new we.hbs.SafeString(html);
  }
}