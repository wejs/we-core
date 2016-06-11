const _ = require('lodash')

/**
 * Build model config for definition from  JSON model config
 *
 * @param  {Object} model
 * @param  {Object} we
 * @return {Object}
 */
module.exports = function defineModelFromJson (model, we) {
  return {
    definition: parseModelAttributes(model.attributes, we),
    associations: model.associations,
    options: model.options,
    hooks: model.hooks,
    classMethods: model.classMethods,
    instanceMethods: model.instanceMethods
  }
}

function parseModelAttributes (attrs, we) {
  if (!attrs) return {}

  var attr = {}

  for (var name in attrs) {
    attr[name] = _.clone(attrs[name])
    attr[name].type = getModelTypeFromDefinition(attrs[name], we)
  }

  return attr
}

function getModelTypeFromDefinition (attr, we) {
  if (attr.size) {
    if (_.isArray(attr.size)) {

      var fn = we.db.Sequelize[attr.type.toUpperCase()]
      fn.apply(null, attr.size)

      return fn(attr.size)
    } else {
      return we.db.Sequelize[attr.type.toUpperCase()](attr.size)
    }
  } else {
    return we.db.Sequelize[attr.type.toUpperCase()]
  }
}
