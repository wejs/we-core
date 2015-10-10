/**
 * RolesController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  create: function create(req, res) {
    var name = req.body.name;
    var description = req.body.description;

    if (req.method == 'POST') {
      req.we.acl.createRole(req.we, {
        name: name, description: description
      }, function (err, role) {
        if (err) {
          req.we.log.error('role:create: error on create role', err);
          res.serverError();
        } else {
          res.created(role);
        }
      });
    } else {
      res.ok();
    }
  },

  edit: function edit(req, res, next) {
    if (!res.locals.data) return next();

    if (req.method == 'POST') {
      // check if this role are in roles cache
      if (!req.we.acl.roles[res.locals.data.name]) return next();

      res.locals.data.updateAttributes(req.body)
      .then(function() {
        // update role in running app cache
        req.we.acl.roles[res.locals.data.name] = res.locals.data;

        return res.ok();
      });
    } else {
      res.ok();
    }
  },

  updateUserRoles: function updateUserRoles(req, res, next) {
    var we = req.we;

    we.db.models.user.findOne({
      where: { id: req.params.userId },
      include: [{ model: we.db.models.role , as: 'roles' }]
    }).then(function (u){
      if (!u) return next();

      res.locals.data = u;

      if (req.method == 'POST') {
        var rolesToSave = [];
        var rn;

        // get role object related to id and skip invalid ids
        if (we.utils._.isArray(req.body.userRoles)) {
          // Ensures that all roleIds is numbers
          req.body.userRoles = req.body.userRoles.map(function (r){
            return Number(r);
          });
          // multiple roles
          for (rn in we.acl.roles) {
            if (req.body.userRoles.indexOf( we.acl.roles[rn].id ) > -1) {
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
  addPermissionToRole: function addPermissionToRole(req, res, next) {
    var we = req.we;

    if (
      !we.acl.roles[req.params.roleName] ||
      !we.acl.permissions[req.params.permissionName]
    ) return next();

    we.acl.addPermissionToRole(we, req.params.roleName, req.params.permissionName, function(err, role) {
      if (err) return res.serverError(err);
      res.ok(role);
    });
  },
  /**
   * remove permission from role action
   */
  removePermissionFromRole: function(req, res, next) {
    var we = req.we;

    if (!we.acl.roles[req.params.roleName]) {
      we.log.warn('Role not found: ',req.params.roleName);
      return next();
    }

    if (!we.acl.permissions[req.params.permissionName]) {
      we.log.warn('Permission not found: ',req.params.permissionName);
      return next();
    }

    we.acl.removePermissionFromRole(we, req.params.roleName, req.params.permissionName, function(err) {
      if (err) return res.serverError(err);
      res.deleted();
    });
  },

  delete: function deleteRecord(req, res) {
    req.we.acl.deleteRole(req.we, res.locals.id,
    function (err) {
      if (err) {
        req.we.log.error('role:delete: error on delete role', err);
        return res.serverError();
      }
      return res.status(200).send();
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