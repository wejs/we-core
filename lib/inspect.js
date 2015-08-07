/**
 * Function to override we.inspect and we.toString
 *
 * @return {string}
 */
module.exports = function inspect() {
  var str = '\nWe.js ;) \n\n';
  str += this.pluginNames.length +' plugins loaded: \n \t' + this.pluginNames.join(' \n \t') + ' \n';

  var rootAttrNames = Object.keys(this);
  str += 'Attrs: \nwe.' + rootAttrNames.join(', we.');

  return str + '\n';
}