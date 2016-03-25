/**
 * We.js ACL code
 */

// libs
var async = require('async');
var fs = require('fs');
var config =  {};

// acl object how by default are avaible in sails.acl
var acl = {};

// -- memory caches
// variable to store roles
acl.roles = {};
// variable to store permissions
acl.permissions = {};

acl.lowerCasePermissionNames = {};

/**
 * Init function, use after start instance models
 *
 * @param  {Object} app
 * @param  {Function} cb callback
 */
acl.init = function initAcl (app, cb) {
  config = app.config;
  // save one reference to app
  this.app = app;

  acl.permissions = app.config.permissions;

  acl.setModelDateFieldPermissions(app);

  // load roles and permissions in parallel
  async.parallel([
    function loadRoles(done) {
      acl.roles = app.config.roles;
      done();
    }
  ], function (err) {
    if (err) {
      throw err;
    }

    app.events.emit('we:acl:after:init', app);
    return cb();
  });
};

/**
 * Function to check if one user has some permission without callback
 *
 * @param  {string} permissionName
 * @param  {string} roleName
 */
function canStatic(permissionName, roleNames) {
  // config for enable or disable ACL
  if ( config.acl.disabled ) return true;
  var can = false;

  // roleNames and permissionName is required
  if (!roleNames || !permissionName) throw new Error('permissionName and roleNames is required for we.acl.canStatic');

  if ( roleNames.indexOf('administrator') > -1 ) return true;

  for (var i = roleNames.length - 1; i >= 0; i--) {
    if (!acl.roles[roleNames[i]]) continue; // role not exists

    // check if role have the permission
    if (acl.roles[roleNames[i]].permissions.indexOf(permissionName) >-1 ) {
      can = true;
      break;
    }
  }

  return can;
}

acl.canStatic = canStatic;

/**
 * Function to check if one user has some permission
 *
 * @param  {string} permissionName
 * @param  {string} roleName
 * @param  {Function} callback
 */
acl.can = function userCan(permissionName, roleNames, callback) {
  callback(null, canStatic(permissionName, roleNames));
};

/**
 * Can we middleware
 * Run for every we.js request
 *
 * @param  {object} req express request
 * @param  {Function} callback
 */
acl.canMiddleware = function usercanMiddleware(req, res, callback) {
  var we = req.getWe();

  acl.loadUserContextRoles(req, res, function(err) {
    if (err) return res.serverError(err);

    if (res.locals.isAdmin) {
      // check if user can access admin pages
      if (!we.acl.canStatic('access_admin', req.userRoleNames))
        return res.forbidden();
    }

    we.hooks.trigger('we:request:acl:after:load:context', {
      req: req, res: res
    }, function (err){
      if (err) return callback(err);

      if (!res.locals.permission || (res.locals.permission === true))
        return callback();

      // config for enable or disable ACL
      if ( we.config.acl.disabled ) return callback();

      acl.can(res.locals.permission, req.userRoleNames, function (err, can) {
        if (err) return callback(err);
        if (!can) {
          if (!req.user) {
            we.log.info('ACL:canMiddleware: forbidden for unAuthenticated user:', res.locals.permission);
          } else {
            we.log.info('ACL:canMiddleware: forbidden for user id: ',
              req.user.id, req.user.username, res.locals.permission, req.userRoleNames
            );
          }
          return res.forbidden();
        }

        return callback();
      });
    });
  });
}

acl.loadUserContextRoles = function loadUserContextRoles(req, res, cb) {
  if (req.userRolesIsLoad) return cb(null, req.userRoleNames);

  if (!req.user) {
    req.userRoleNames.push('unAuthenticated');
    return cb();
  }
  req.user.getRoles().then(function (roles) {
    req.userRoleNames = roles;

    req.userRoleNames.push('authenticated');
    req.userRolesIsLoad = true;

    cb(null, roles);
  }).catch(cb);
}

/**
 * Create and register one of the default roles if not exists
 *
 * @param  {object} we
 * @param  {string} roleName
 * @param  {Function} done / callback
 *
 */
acl.registerOneDefaltRole = function registerOneDefaltRole(we, roleName, done) {
  // skip if this default role already exists
  if ( acl.roles[roleName] ) return done();
  acl.createRole(we, {
    name: roleName,
    isSystemRole: true
  }, done);
}

/**
 * Create and register one role
 *
 * @param {object} we.js object
 * @param  {object} data { name: 'roleName', ... } the new role object
 * @param  {Function} cb  callback
 */
acl.createRole = function createRole(we, data, cb) {
  if (acl.roles[data.roleName]) {
    // skip if role already exists
    return cb(null, acl.roles[data.roleName], true);
  }
  // add the role
  acl.roles[data.name] = data;
  // then write to file
  acl.writeRolesToConfigFile(function afterSaveRoles(err){
    return cb(err, acl.roles[data.name]);
  });
}

/**
 * DDelete one role and remove from roles array
 *
 * @param {object} we.js object
 * @param  {String} roleName
 * @param  {Function} cb  callback
 */
acl.deleteRole = function deleteRole(we, roleName, cb) {
  // if delete the role
  delete acl.roles[roleName];
  // then write to file
  acl.writeRolesToConfigFile(cb);
}

/**
 * Add permission to role
 *
 * @param {Object}   we
 * @param {String|Object}   roleName or loaded role
 * @param {String|Object}   permissionName or loaded permission
 * @param {Function} cb             callback
 */
acl.addPermissionToRole = function addPermissionToRole(we, roleName, permissionName, cb) {
  if (!we.acl.roles[roleName].permissions)
    we.acl.roles[roleName].permissions = [];

  we.acl.roles[roleName].permissions.push(permissionName);
  we.acl.writeRolesToConfigFile(cb);
}

/**
 * Remove permission from role
 *
 * @param {Object}   we
 * @param {String|Object}   roleName or loaded role
 * @param {String|Object}   permissionName or loaded permission
 * @param {Function} cb             callback
 */
acl.removePermissionFromRole = function removePermissionFromRole(we, roleName, permissionName, cb) {

  if (!we.acl.roles[roleName].permissions)
    we.acl.roles[roleName].permissions = [];

  var index = we.acl.roles[roleName]
    .permissions.indexOf(permissionName);

  if (index < -1) {
    we.acl.roles[roleName].permissions.splice(index, 1);
  }

  we.acl.writeRolesToConfigFile(cb);
}

/**
 * Set model date field permissions
 * @param {Object} we
 */
acl.setModelDateFieldPermissions = function setModelDateFieldPermissions(we) {
  for(var name in we.db.models) {
    acl.permissions[name+'-edit-field-createdAt'] = {
      title: 'Edit '+name+' createdAt field',
      description: ''
    };
    acl.permissions[name+'-edit-field-updatedAt'] = {
      title: 'Edit '+name+' updatedAt field',
      description: ''
    };
  }
}

/**
 * Export all roles in JSON
 *
 * @return {Object} roles
 */
acl.exportRoles = function exportRoles() {
  var role;
  var roles = {};

  for(var name in acl.roles) {
    role = acl.roles[name];
    delete role.id;
    delete role.createdAt;
    delete role.updatedAt;
    delete role.linkPermanent;

    roles[name] = role;
  }

  return roles;
}

acl.writeRolesToConfigFile = function writeRolesToConfigFile(done) {
  var app = this.app;

  var roles = acl.exportRoles();

  var data = 'module.exports = {\n'+
    '\'roles\': '+
      JSON.stringify(roles, null, '\t')
      .replace(/\"/g, '\'') +
    '\n'+
  '};\n';

  var file = app.projectPath+'/config/roles.js';

  fs.writeFile(file, data, function (err){
    if (err) return done(err);

    app.log.info('Roles saved in file: ' + file);

    done();
  });
}

module.exports = acl;