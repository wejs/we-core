/**
 * Permission
 *
 * @module      :: Model
 * @description :: Activity model
 *
 */

module.exports = {
  schema: true,
  attributes: {
    controller: {
      type: 'string'
    },
    action: {
      type: 'string'
    },
    name: {
      type: 'string',
      unique: true,
      required: true
    },

    roles: {
      collection: 'role',
      via: 'permissions'
    }
  }

};
