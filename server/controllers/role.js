/**
 * RolesController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  create: function(req, res) {
    var we = req.getWe();

    var name = req.body.name;
    var description = req.body.description;

    if (req.method == 'POST') {
      we.acl.createRole(we, {
        name: name,
        description: description
      }, function(err, role) {
        if (err) {
          we.log.error('role:create: error on create role', err);
          return res.serverError();
        }

        return res.created(role);
      });
    } else {
      res.ok();
    }
  },

  update: function update(req, res, next) {
    var we = req.getWe();

    if (!res.locals.record) return res.notFound();

    if (req.method == 'POST') {
      if (!res.locals.record) return next();
      // check if this role are in roles cache
      if (we.acl.roles[!res.locals.record.name]) return res.notFound();

      res.locals.record.updateAttributes(req.body)
      .then(function() {
        res.locals.record = res.locals.record;
        // update role in running app cache
        we.acl.roles[res.locals.record.name] = res.locals.record;

        return res.ok();
      });
    } else {
      res.ok();
    }
  },

  updateUserRoles: function updateUserRoles(req, res) {
    var we = req.getWe();

    we.db.models.user.findOne({
      where: { id: req.params.userId },
      include: [{ model: we.db.models.role , as: 'roles' }]
    }).then(function(u){
      if (!u) return res.notFound();

      res.locals.record = u;

      if (req.method == 'POST') {
        var rolesToSave = [];
        var rn;

        // get role object related to id and skip invalid ids
        if (we.utils._.isArray(req.body.userRoles)) {
          // multiple roles
          for (rn in we.acl.roles) {
            if (req.body.userRoles.indexOf( String(we.acl.roles[rn].id) ) > -1) {
              rolesToSave.push(we.acl.roles[rn]);
            }
          }
        } else {
          // single role
          for (rn in we.acl.roles) {
            if (req.body.userRoles == we.acl.roles[rn].id) {
              rolesToSave.push(we.acl.roles[rn]);
              break;
            }
          }
        }

        res.locals.rolesTable = buildUserRolesVar(res, u, we);

        u.setRoles(rolesToSave).then(function () {
          res.addMessage('success', 'role.updateUserRoles.success');
          res.goTo(req.url);
        }).catch(req.queryError);
      } else {
        res.locals.roles = we.acl.roles;
        res.locals.rolesTable = buildUserRolesVar(res, u, we);
        res.ok();
      }
    }).catch(res.queryError);
  },

  /**
   * Add permission to role action
   */
  addPermissionToRole: function(req, res) {
    var we = req.getWe();

    if (we.acl.roles[!req.params.roleName]) return res.notFound();
    if (we.acl.permissions[!req.params.permissionName]) return res.notFound();

    we.acl.addPermissionToRole(we, req.params.roleName, req.params.permissionName, function(err, role) {
      if (err) return res.serverError(err);
      res.ok(role);
    });
  },
  /**
   * remove permission from role action
   */
  removePermissionFromRole: function(req, res) {
    var we = req.getWe();

    if (we.acl.roles[!req.params.roleName]) {
      we.log.warn('Role not found: ',req.params.roleName);
      return res.notFound();
    }
    if (we.acl.permissions[!req.params.permissionName]) {
      we.log.warn('Permission not found: ',req.params.permissionName);
      return res.notFound();
    }

    we.acl.removePermissionFromRole(we, req.params.roleName, req.params.permissionName, function(err) {
      if (err) return res.serverError(err);
      res.deleted();
    });
  },

  destroy: function destroy(req, res) {
    var we = req.getWe();

    we.acl.deleteRole(we, res.locals.id, function(err, role) {
      if (err) {
        we.log.error('role:delete: error on delete role', err);
        return res.serverError();
      }

      return res.status(200).send(role);
    });
  }
};


function buildUserRolesVar(res, u, we) {
  var checked, rolesTable = [];

  for (var roleName in we.acl.roles) {
    checked = false;
    for (var i = 0; i < u.roles.length; i++) {
      if (u.roles[i].name === roleName) {
        checked = true;
        break;
      }
    }

    rolesTable.push({
      id: we.acl.roles[roleName].id,
      name: roleName,
      checked: checked
    });
  }

  return rolesTable;
}