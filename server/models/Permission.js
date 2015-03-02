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
    },

    toJSON: function() {
      var obj = this.toObject();

      delete obj.createdAt;
      delete obj.updatedAt;

      return obj;
    }
  }

};
