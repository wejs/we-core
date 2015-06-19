/**
 * PermissionController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  manage: function manage(req, res) {
    var we = req.getWe();
    var permissions = [];

    Object.keys(we.config.permissions).forEach(function(pN){
      we.config.permissions[pN].name = pN;
      permissions.push( we.config.permissions[pN] );
    });

    res.locals.record = permissions;
    res.locals.permissions = permissions;

    we.db.models.role.findAll({
      order: 'name ASC'
    }).then(function (roles){
      res.locals.metadata.count = permissions.length;
      res.locals.roles = roles;
      return res.ok();
    });
  }
};
