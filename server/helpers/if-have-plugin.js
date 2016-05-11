/**
 * We {{id-have-plugin}}  helper
 *
 * usage:
 *   {{#if-have-plugin 'pluginName'}} have {{else}} done have {{/if-have-plugin}}
 */

module.exports = function(we) {
  return function helper(pluginName) {
    var options = arguments[arguments.length-1];

    if (we.plugins[pluginName]) return options.fn(this);

    return options.inverse(this);
  }
}