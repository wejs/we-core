/**
 * Role
 *
 * @module      :: Model
 * @description :: Role model
 *
 */

module.exports = {
  schema: true,
  attributes: {

    name: {
      type: 'string',
      unique: true,
      required: true
    },

    description: {
      type: 'string'
    },

    permissions: {
      collection: 'permission',
      via: 'roles',
      dominant: true
    }
  }

};
