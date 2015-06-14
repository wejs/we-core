/**
 * Widget wrapper helper
 *
 * usage:  {{#widget-wrapper}} {{/widget-wrapper}}
 */
module.exports = function() {
  return function renderWidgetBlock(record, options) {
    var w = '<widget data-widget-type="'+record.type+
    '" data-widget-id="'+record.id+
    '" class="widget widget-'+record.type+'">';

    w += '<widget-header class="widget-header">';
    if (record.title) {
      w += '<h3>'+ record.title +'</h3>';
    }

    w += '</widget-header>';
    w += '<widget-content class="widget-content">';
      w += options.fn(this);
    w += '</widget-content>';

    w += '</widget>';
    return w;
  }
}