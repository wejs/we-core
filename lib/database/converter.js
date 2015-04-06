/**
 * Converts we,js models to ember.js models
 * usually used to create models of the files ember.js
 *
 * TODO add suport to convert to one object
 */

var converter = {};
var templates = require('./templates.js');
converter.templates = templates;

var db = require('./index.js');

/**
 * Convert one we.js model to ember.js model string for send to user browser for save in one file
 *
 * @param  {string} modelName  model name ex.: user, post ...
 * @param  {object} wejsModel we,js model from we.models[model]
 * @param  {string} appName    optional app name
 * @return {string}            model string for send to user browser
 */
converter.convertToEmberJSFile = function convertToEmberJSFile (modelName, wejsModel, appName) {

  // ember.js model name
  if (wejsModel.options && wejsModel.options.clientAppModelName )
    modelName = wejsModel.options.clientAppModelName;

  // appName is a optional param
  if (!appName) appName = 'App';

  // skip if dont have this attrs
  if (!wejsModel.definition) return;

  var attrs = [],
    attrNames = Object.keys(wejsModel.definition);

  attrNames.forEach(function (attrName) {

    // console.log('attrName', attrName)
    // console.log('attr', wejsModel.definition[attrName])

    // skip id attr
    if (attrName !== 'id') {
      var attr = wejsModel.definition[attrName],
        attrData = {};

      attrData.name = attrName;
      attrData.defaultValue = attr.defaultValue;

      // data fields
      if (!attr.model || !attr.collection) {
      // if is a data attr
        switch (attr.type.key) {
          case 'date':
            attrs.push(templates.attrs.date(attrData));
            break;
          case 'array':
            attrs.push(templates.attrs.clean(attrData));
            break;
          case 'datetime':
            attrs.push(templates.attrs.date(attrData));
            break;
          case 'integer':
            attrs.push(templates.attrs.number(attrData));
            break;
          case 'BOOLEAN':
            attrs.push(templates.attrs.boolean(attrData));
            break;
          default:
            attrs.push(templates.attrs.string(attrData));
        }
      }
    }
  });

  // add createdAt field
  attrs.push(templates.attrs.date({
    name: 'createdAt'
  }));
  // add updatedAt field
  attrs.push(templates.attrs.date({
    name: 'updatedAt'
  }));
  // add deletedAt field
  attrs.push(templates.attrs.date({
    name: 'deletedAt'
  }));

  if (wejsModel.associations) {
    var assocAttrNames = Object.keys(wejsModel.associations);
      // search for hasMany associations
    assocAttrNames.forEach(function (attrName) {
      if (attrName == 'password') return;

      var attrData = {};
      var attr = wejsModel.associations[attrName];

      // has many associations NxN
      if (attr.type === 'belongsToMany' || attr.type === 'hasMany') {
        attrData.name = attrName;
        attrData.relationName = attr.model;
        attrData.inverse = attr.inverse;

        // TODO allow async config
        attrData.async = true;

        attrs.push(templates.attrs.hasMany(attrData));

      } else {
      // bellogsTo associations 1xN
        attrData.name = attrName;
        attrData.relationName = attr.model;
        attrData.inverse = attr.inverse;

        // TODO allow async config
        attrData.async = true;

        attrs.push(templates.attrs.belongsTo(attrData));
      }

    });
  }

  // terms and tag fields
  if (wejsModel.options && wejsModel.options && wejsModel.options.termFields) {
    attrNames = Object.keys(wejsModel.options.termFields);

    attrNames.forEach(function(attrName) {

      attrs.push(templates.attrs.term({
        name: attrName,
        vocabularyId: wejsModel.options.termFields[attrName].vocabularyId,
        canCreate: wejsModel.options.termFields[attrName].canCreate
      }));

    })


  }

  return templates.model({
    appName: appName,
    modelName: modelName,
    attrs: attrs.join()
  });
}

/**
 * Convert multiple we.js models to one ember.js models file
 *
 * @param  {object} wejsModels we,js models usually something like we.models
 * @return {string}             models file for sent to user browser or save in one file
 */
converter.convertMultipleToEmberJSFile = function convertMultipleToEmberJSFile (wejsModels) {
  var emberModels = '',
    modelNames = Object.keys(wejsModels);

  modelNames.forEach(function (modelName) {
    var emberModel = converter.convertToEmberJSFile(modelName, wejsModels[modelName]);
    if (emberModel) {
      emberModels+= emberModel;
    }
  })

  return emberModels;
}

module.exports = converter;