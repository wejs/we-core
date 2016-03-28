/**
 * PermissionController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  manage: function manage(req, res) {
    var we = req.we;
    var permissions = [];

    Object.keys(we.config.permissions).forEach(function(pN){
      we.config.permissions[pN].name = pN;
      permissions.push( we.config.permissions[pN] );
    });

    res.locals.data = permissions;
    res.locals.permissions = permissions;

    res.locals.metadata.count = permissions.length;
    res.locals.roles =  we.acl.roles;

    if (req.accepts('json')) {
      res.send({ role: res.locals.roles });
    } else {
      res.ok();
    }

  }
};
