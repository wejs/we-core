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
  },

  update: function update(req, res, next) {
    var we = req.getWe();
    var id = req.params.id;

    res.locals.Model.findById(id)
    .then(function(record) {
      if (!record) return next();
      // check if this role are in roles cache
      if (we.acl.roles[!record.name]) return res.notFound();

      record.updateAttributes(req.body)
      .then(function() {
        res.locals.record = record;
        // update role in running app cache
        we.acl.roles[record.name] = record;

        return res.ok();
      });
    });
  },

  addRoleToUser: function(req, res) {
    var we = req.getWe();

    var roleName = req.body.roleName;

    if (!roleName) {
      res.addMessage('warn', 'role.addRoleToUser.param.roleName.required');
      return res.badRequest();
    }

    res.locals.Model.findById(req.params.id)
    .then(function (user) {
      if (!user) {
        res.addMessage('warn', 'role.addRoleToUser.user.not.found');
        return res.notFound();
      }

      // check if the role exists
      we.db.models.role.find({ where:
        { name: roleName }
      }).then(function (role){
        if (!role) {
          res.addMessage('warn', 'role.addRoleToUser.role.not.found');
          return res.badRequest();
        }

        user.addRole(role).then(function () {
          res.addMessage('success', 'role.addRoleToUser.success');
          return res.ok();
        });
      });
    });
  },

  removeRoleFromUser: function (req, res) {
    var we = req.getWe();

    var roleName = req.body.roleName;

    if (!roleName) {
      res.addMessage('warn', 'role.removeRoleFromUser.param.roleName.required');
      return res.badRequest();
    }

    res.locals.Model.find({
      where: { id: req.params.id },
      include: [ { model: we.db.models.role, as: 'roles'} ]
    }).then(function (user) {
      if (!user) {
        res.addMessage('warn', 'role.removeRoleFromUser.user.not.found');
        return res.notFound();
      }

      var roleToDelete = null;

      for (var i = user.roles.length - 1; i >= 0; i--) {
        if (user.roles[i].name == roleName ) {
          roleToDelete = user.roles[i];
          break;
        }
      }

      if (!roleToDelete) {
        // this user dont have the role with name roleName
        res.addMessage('success', 'role.removeRoleFromUser.success');
        return res.ok();
      }

      user.removeRole(roleToDelete).then(function() {
        res.addMessage('success', 'role.removeRoleFromUser.success');
        return res.ok();
      });
    });
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


  destroy: function (req, res) {
    var we = req.getWe();

    var id = req.params.id;

    we.acl.deleteRole(we, id, function(err, role) {
      if (err) {
        we.log.error('role:delete: error on delete role', err);
        return res.serverError();
      }

      return res.status(200).send(role);
    });
  },

  add: function (req, res) { return res.notFound(); },
  remove: function (req, res) { return res.notFound(); }
};
