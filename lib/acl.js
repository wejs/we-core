/**
 * We.js ACL code
 */

// libs
var async = require('async');

// acl object how by default are avaible in sails.acl
var acl = {};

// -- memory caches
// variable to store roles
acl.roles = {};
// variable to store permissions
acl.permissions = {};

/**
 * Init function, use after start waterline
 *
 * @param  {object} sails
 * @param  {Function} cb callback
 */
acl.init = function initAcl (sails, cb) {
  // load roles and permissions in parallel
  async.parallel([
    function loadPermissions(done) {
      acl.loadAllPermissions(sails, function(err, permissions) {
        if (err) done(err);
        acl.permissions = permissions;
        done();
      })
     },
    function loadRoles(done) {
      acl.loadAllRoles(sails, function(err, roles) {
        if (err) done(err);
        acl.roles = roles;
        done();
      })
    }
  ], function(err) {
    if (err) return cb(err);
    // ensures that default roles are avaible
    acl.createDefaultRolesIfNotExists(sails, function(err) {
      if (err) cb(err);
      cb();
    })
  });
}

/**
 * Function to check if one user has some permission
 *
 * @param  {string} permissionName
 * @param  {object} user
 * @param  {Function} callback
 */
acl.can = function userCan(permissionName, user, callback) {
  var can = false;

  // return false if this permission dont have roles
  if (
    !acl.permissions[permissionName] ||
    acl.permissions[permissionName].roles.length < 0
  ) {
    return callback(null, can);
  }

  var roles = [];

  if (!user) {
    roles.push('unAuthenticated');
  } else {
    if ( user.roles ) {
      roles = user.roles;
    }
    roles.push('authenticated');
  }

  var permission = acl.permissions[permissionName];

  for (var i = permission.roles.length - 1; i >= 0; i--) {
    if ( roles.indexOf(permission.roles[i].name) >= 0 ) {
      can = true;
      break;
    }
  }
  callback(null, can);
}

/**
 * Can sails policy
 * Run for every sails.js request
 *
 * @param  {object} req express request
 * @param  {Function} callback
 */
acl.canPolicy = function userCan(req, callback) {
  // only check if has action and controller
  if (!req.options || !req.options.controller || !req.options.action)
    return callback(null, true);
  // if user is admin can do everything
  if (req.isAuthenticated() && req.user.isAdmin && req.user.active)
    return callback(null, true);

  var permissionName = req.options.controller + '_' + req.options.action;
  acl.can(permissionName, req.user, callback);
}

acl.loadAllPermissions = function(sails, cb) {
  return sails.models.permission.find()
  .limit( 400 )
  .populate('roles')
  .exec(function found(err, matchingRecords) {
    if (err) return cb(err);
    var permissions = {};
    for (var i = matchingRecords.length - 1; i >= 0; i--) {
      permissions[matchingRecords[i].name] = matchingRecords[i];
    }
    return cb(null, permissions);
  });
}

acl.loadAllRoles = function(sails, cb) {
  return sails.models.role.find()
  .limit( 50 )
  .exec(function found(err, matchingRecords) {
    if (err) return cb(err);
    var roles = {};
    for (var i = matchingRecords.length - 1; i >= 0; i--) {
      roles[matchingRecords[i].name] = matchingRecords[i];
    }
    return cb(null, roles);
  });
}

acl.getAllActionPermisons = function(sails, callback) {
  var controllers = sails.controllers;
  var permissions = {};

  var controllerNames = Object.keys(sails.controllers);

  async.each(controllerNames, function (controllerName, next) {

    if (hasBlueprint(controllerName, sails)) {
      permissions[controllerName + '_' + 'find'] =
        generatePermissionObject(controllerName, 'find');

      permissions[controllerName + '_' + 'findOne'] =
        generatePermissionObject(controllerName, 'findOne');

      permissions[controllerName + '_' + 'create'] =
        generatePermissionObject(controllerName, 'create');

      permissions[controllerName + '_' + 'update'] =
        generatePermissionObject(controllerName, 'update');

      permissions[controllerName + '_' + 'add'] =
        generatePermissionObject(controllerName, 'add');

      permissions[controllerName + '_' + 'remove'] =
        generatePermissionObject(controllerName, 'remove');

      permissions[controllerName + '_' + 'delete'] =
        generatePermissionObject(controllerName, 'delete');
    }

    var actionNames = Object.keys(controllers[controllerName]);
    for (var i = actionNames.length - 1; i >= 0; i--) {
      if(!_.isObject(controllers[controllerName][actionNames[i]]))
        continue;

      permissions[controllerName + '_' + actionNames[i]] =
        generatePermissionObject(controllerName, actionNames[i]);
    }

    next();
  }, function(err) {
    callback(err, permissions);
  })
}

acl.generatePermissionObject = function (controllerName, actionName) {
  return {
    controller: controllerName,
    action: actionName,
    name: controllerName + '_' + actionName
  }
}

acl.hasBlueprint = function(name, sails) {

  // check if rest blueprint is disabled
  if (sails.controllers[name] && sails.controllers[name]._config) {
    if(sails.controllers[name]._config === false) {
      return false;
    }
  }
  // check if has a model with same name as this controller
  if( !sails.models[name])
    return false;

  return true;
}

/**
 * Check and create default roles required for all we.js projects
 *
 * @param  {object} sails
 * @param  {Function} cb callback
 */
acl.createDefaultRolesIfNotExists = function createDefaultRolesIfNotExists(sails, cb) {
  async.parallel([
    function unAuthenticatedRole(done) {
      acl.registerOneDefaltRole(sails, 'unAuthenticated', done);
    },
    function authenticatedRole(done) {
      acl.registerOneDefaltRole(sails, 'authenticated', done);
    },
    function ownerRole(done) {
      acl.registerOneDefaltRole(sails, 'owner', done);
    },
    function administratorRole(done) {
      acl.registerOneDefaltRole(sails, 'administrator', done);
    }
  ], cb)
}

/**
 * Create and register one of the default roles if not exists
 *
 * @param  {object} sails
 * @param  {string} roleName
 * @param  {Function} done / callback
 *
 */
acl.registerOneDefaltRole = function registerOneDefaltRole(sails, roleName, done) {
  // skip if this default role already exists
  if ( acl.roles[roleName] )
    return done();
  acl.createRole(sails, {  name: roleName }, done);
}

/**
 * Create and register one role
 *
 * @param {object} sails.js object
 * @param  {object} data { name: 'roleName', ... } the new role object
 * @param  {Function} cb  callback
 * @return {[type]} waterline create query promisse
 */
acl.createRole = function createRole(sails, data, cb) {
  // if not exists create the role
  return sails.models.role.create(data)
  .exec(function (err, role) {
    if (err) return cb(err);
    // set the role in global roles how will be avaible in sails.acl.roles
    acl.roles[data.name] = role;
    cb();
  })
}

module.exports = acl;