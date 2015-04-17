/**
 * PermissionController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  find: function findAll(req, res) {
    var we = req.getWe();
    var permissions = [];

    Object.keys(we.config.permissions).forEach(function(pN){
      we.config.permissions[pN].name = pN;
      permissions.push( we.config.permissions[pN] );
    })

    return res.send({
      permission: permissions,
      meta: {
        count: permissions.length
      }
    });
  }
};
