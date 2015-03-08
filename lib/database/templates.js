/**
 * Template functions for convert one we.js attribute to one ember.js attribute string
 *
 */

var templates = {};

templates.model = function(data) {
  var str = '',
    emberName = toUp(data.modelName);

  str += data.appName + '.' + emberName + ' = DS.Model.extend({ \n';

  str += data.attrs + '\n';

  str += '}); \n';

  return str;
}

templates.attrs = {};

templates.attrs.clean = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.attr() \n';
  return str;
}

templates.attrs.string = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.attr("string", {';

  if (data.defaultValue) {
    str += '\n \t\t defaultValue: "' + data.defaultValue + '" \n';
  }

  str += '\t}) \n';
  return str;
}

templates.attrs.number = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.attr("number", {';

  if (data.defaultValue) {
    str += '\n \t\t defaultValue: "' + data.defaultValue + '" \n';
  }

  str += '\t}) \n';
  return str;
}

templates.attrs.date = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.attr("date", {';

  if (data.defaultValue) {
    str += '\n \t\t defaultValue: "' + data.defaultValue + '" \n';
  }

  str += '\t}) \n';
  return str;
}

templates.attrs.boolean = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.attr("boolean", {';

  if (data.defaultValue) {
    str += '\n \t\t defaultValue: "' + data.defaultValue + '" \n';
  }

  str += '\t}) \n';
  return str;
}

// -- relationships

templates.attrs.belongsTo = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.belongsTo("' + data.relationName + '", {';

  if (data.inverse) {
    str += '\n \t\t inverse: "' + data.inverse + '", ';
  }

  if (data.async) {
    str += '\n \t\t async: true \n';
  }

  str += '\t}) \n';
  return str;
}

templates.attrs.hasMany = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.hasMany("' + data.relationName + '", {';

  if (data.inverse) {
    str += '\n \t\t inverse: "' + data.inverse + '", \n';
  }

  if (data.async) {
    str += ' \t\t async: true \n';
  }

  str += '\t}) \n';
  return str;
}

/**
 * Convert te first letter of one string to uppercase
 *
 * @param  {sring} str
 * @return {string}
 */
function toUp(str) {
  return str[0].toUpperCase() + str.substring(1);
}

module.exports = templates;