/**
 * Render we.js form
 *
 * usage: {{{form}}}
 */

module.exports = function(we) {
  return function form () {
    var html = '<form>';

    html += '<input type="text" class="form-control" placeholder="Name" id="name" required="" data-validation-required-message="Please enter your name." aria-invalid="false">';

    html += '</form>';

    return html;
  }
}