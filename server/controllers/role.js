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

  addRoleToUser: function(req, res) {
    var we = req.getWe();

    var roleName = req.body.roleName;

    if (!roleName) {
      res.addMessage('warn', 'role.addRoleToUser.param.roleName.required');
      return res.badRequest();
    }

    res.locals.Model.find(req.params.id)
    .done(function(err, user) {
      if (err) {
        we.log.error('role:addRoleToUser: Error on find user', err);
        return res.serverError(err);
      }

      if (!user) {
        res.addMessage('warn', 'role.addRoleToUser.user.not.found');
        return res.notFound();
      }

      // check if the role exists
      we.db.models.role.find({ where:
        { name: roleName }
      }).done(function(err, role){
        if (err) {
          we.log.error('role:addRoleToUser: Error on find role', err);
          return res.serverError(err);
        }

        if (!role) {
          res.addMessage('warn', 'role.addRoleToUser.role.not.found');
          return res.badRequest();
        }

        user.addRole(role).done(function(err) {
          if (err) {
            we.log.error('role:addRoleToUser: Error on add role to user', err);
            return res.serverError();
          }

          res.addMessage('success', 'role.addRoleToUser.success');
          return res.ok();
        });
      });
    });
  },

  removeRoleFromUser: function(req, res) {
    var we = req.getWe();

    var roleName = req.body.roleName;

    if (!roleName) {
      res.addMessage('warn', 'role.removeRoleFromUser.param.roleName.required');
      return res.badRequest();
    }

    res.locals.Model.find({
      where: { id: req.params.id },
      include: [ { model: we.db.models.role, as: 'roles'} ]
    }).done(function (err, user) {
      if (err) {
        we.log.error('role:removeRoleFromUser: Error on find user', err);
        return res.serverError(err);
      }

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

      user.removeRole(roleToDelete).done(function(err) {
        if (err) {
          we.log.error('role:removeRoleFromUser: Error on remove role from user', err);
          return res.serverError();
        }

        res.addMessage('success', 'role.removeRoleFromUser.success');
        return res.ok();
      });
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
