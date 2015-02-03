/**
 * We.js ACL code
 */

// libs
var async = require('async');
var _ = require('lodash');

// acl object how by default are avaible in sails.acl
var acl = {};

// -- memory caches
// variable to store roles
acl.roles = {};
// variable to store permissions
acl.permissions = {};

acl.lowerCasePermissionNames = {};

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
        if (err) return done(err);
        acl.permissions = permissions;
        done();
      })
     },
    function loadRoles(done) {
      acl.loadAllRoles(sails, function(err, roles) {
        if (err) return done(err);
        acl.roles = roles;
        done();
      })
    }
  ], function(err) {
    if (err) return cb(err);
    // ensures that default roles are avaible
    acl.createDefaultRolesIfNotExists(sails, function(err) {
      if (err) return cb(err);
      cb();
    })
  });
}

acl.resolvePermissionName = function resolvePermissionName(permissionName) {
  if (!acl.permissions[permissionName] && (acl.lowerCasePermissionNames[permissionName]) ) {
    return acl.lowerCasePermissionNames[permissionName];
  }
  return permissionName;
},

/**
 * Function to check if one user has some permission
 *
 * @param  {string} permissionName
 * @param  {object} user
 * @param  {Function} callback
 */
acl.can = function userCan(permissionName, user, record, callback) {
  var can = false;

  // return false if this permission dont have roles
  if (
    !acl.permissions[permissionName] ||
    !acl.permissions[permissionName].roles ||
    acl.permissions[permissionName].roles.length < 1
  ) {
    return callback(null, can);
  }

  var context = acl.getUserContext(user, record);
  var roles = context.roles;

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
 * get context for user
 *
 * @param  {object} user
 * @param  {object} record
 * @return {object} context
 */
acl.getUserContext = function(user, record) {
  var context = {
    roles: []
  };

  if (!user) {
    // - unAuthenticated roles
    context.roles.push('unAuthenticated');
    return context;
  } else if(user._context) {
    context =  user._context;
  } else {
    // - authenticated roles
    if ( user.roles ) {
      context.roles = user.roles;
    }
    context.roles.push('authenticated');
  }

  // - owner roles
  if ( record && record.creator) {
    var creatorId;
    if (_.isString(record.creator)) {
      creatorId = record.creator;
    } else {
      creatorId = record.creator.id;
    }

    if (user.id == creatorId) context.role.push('owner');
  }

  // save one cache
  user._context = context;

  return context;
}

/**
 * Can sails policy
 * Run for every sails.js request
 *
 * @param  {object} req express request
 * @param  {Function} callback
 */
acl.canPolicy = function userCanPolicy(req, callback) {
  // config for enable or disable ACL
  if ( req._sails.config.acl.disabled ) return callback();
  // only check if has action and controller
  if (!req.options || !req.options.controller || !req.options.action)
    return callback(null, true);
  // if user is admin can do everything
  if (req.isAuthenticated() && req.user.isAdmin && req.user.active)
    return callback(null, true);

  if (acl.checkIfAclIsDisabledInController(req.options.controller, req._sails))
    return callback(null, true);

  var record;
  // get record from context - see sails-context
  if (req.context && req.context.record)
    record = req.context.record;

  var permissionName = acl.resolvePermissionName( req.options.controller + '_' + req.options.action );
  acl.can(permissionName, req.user, record, callback);
}

/**
 * Check if acl is disabled to this controller
 *
 * @param  {string} controllerName
 * @param  {object} sails
 * @return {boolean} true for disabled or false for enabled
 */
acl.checkIfAclIsDisabledInController = function checkIfAclIsDisabledInController(controllerName, sails) {
  if (
    sails.controllers[controllerName] &&
    sails.controllers[controllerName]._config &&
    sails.controllers[controllerName]._config.acl === false
  ){
    // is disabled
    return true;
  }
  // not is disabled
  return false;
}

/**
 * Load all permissions from database
 *
 * @param  {object} sails
 * @param  {Function} callback
 * @return {object} waterline find promisse
 */
acl.loadAllPermissions = function loadAllPermissionsFromDB(sails, cb) {
  return sails.models.permission.find()
  .limit( 400 )
  .populate('roles')
  .exec(function found(err, matchingRecords) {
    if (err) return cb(err);
    var permissions = {};
    for (var i = matchingRecords.length - 1; i >= 0; i--) {
      permissions[ matchingRecords[i].name ] = matchingRecords[i];
      // lower case caches
      acl.lowerCasePermissionNames[matchingRecords[i].name.toLowerCase()] = matchingRecords[i].name;
    }
    return cb(null, permissions);
  });
}

/**
 * Load all roles from DB
 * @param  {object} sails
 * @param  {Function} cb  callback
 * @return {object} waterline find promisse
 */
acl.loadAllRoles = function loadAllRolesFromDB(sails, cb) {
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

/**
 * Get all acl permissions from sails.controllers
 * @param  {object} sails
 * @param  {Function} callback
 */
acl.getAllActionPermisons = function(sails, callback) {
  var controllers = sails.controllers;
  var permissions = {};

  var controllerNames = Object.keys(sails.controllers);

  async.each(controllerNames, function (controllerName, next) {
    // skip if disabled
    if (acl.checkIfAclIsDisabledInController(controllerName, sails))
      return next();

    if (acl.hasBlueprint(controllerName, sails)) {
      permissions[controllerName + '_' + 'find'] =
        acl.generatePermissionObject(controllerName, 'find');

      permissions[controllerName + '_' + 'findOne'] =
        acl.generatePermissionObject(controllerName, 'findOne');

      permissions[controllerName + '_' + 'create'] =
        acl.generatePermissionObject(controllerName, 'create');

      permissions[controllerName + '_' + 'update'] =
        acl.generatePermissionObject(controllerName, 'update');

      permissions[controllerName + '_' + 'add'] =
        acl.generatePermissionObject(controllerName, 'add');

      permissions[controllerName + '_' + 'remove'] =
        acl.generatePermissionObject(controllerName, 'remove');

      permissions[controllerName + '_' + 'delete'] =
        acl.generatePermissionObject(controllerName, 'delete');
    }

    var actionNames = Object.keys(controllers[controllerName]);
    for (var i = actionNames.length - 1; i >= 0; i--) {
      if( !_.isObject(controllers[controllerName][actionNames[i]]) )
        continue;

      permissions[controllerName + '_' + actionNames[i]] =
        acl.generatePermissionObject(controllerName, actionNames[i]);
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