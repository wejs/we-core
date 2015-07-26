/**
 * Widget wrapper helper
 *
 * usage:  {{#widget-wrapper}} {{/widget-wrapper}}
 */
module.exports = function(we) {
  return function renderWidgetBlock(record, options) {
    // DEPRECATED!
    return options.fn(this);
  }
}