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

templates.attrs.simpleField = function(data, fieldType) {
  if (!fieldType) fieldType = 'string';

  var str = '';
  str += '\t' + data.name + ': DS.attr("'+fieldType+'", {';

  if (data.defaultValue) {
    str += '\n \t\t defaultValue: "' + data.defaultValue + '" \n';
  }

  str += '\t}) \n';
  return str;
}

templates.attrs.string = function(data) {
  return templates.attrs.simpleField(data, 'string');
}

templates.attrs.number = function(data) {
  return templates.attrs.simpleField(data, 'number');
}

templates.attrs.date = function(data) {
   return templates.attrs.simpleField(data, 'date');
}

templates.attrs.boolean = function(data) {
  return templates.attrs.simpleField(data, 'boolean');
}

// -- relationships

templates.attrs.belongsTo = function(data, joinFNName) {
  var str = '';

  if (!joinFNName) joinFNName = 'DS.belongsTo';

  str += '\t' + data.name + ': '+ joinFNName +'("' + data.relationName + '", {';

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
  return templates.attrs.belongsTo(data, 'DS.hasMany');
}

templates.attrs.term = function(data) {
  var str = '';
  str += '\t' + data.name + ': DS.attr("term", {';

  if (data.defaultValue) {
    str += '\n \t\t defaultValue: "' + data.defaultValue + '", \n';
  }

  str += '\n \t\t canCreate: ' + data.canCreate + ', \n';

  if (data.vocabularyId) {
    str += '\n \t\t vocabularyId: "' + data.vocabularyId + '" \n';
  } else {
    str += '\n \t\t vocabularyId: null \n';
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