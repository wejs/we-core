/**
 * We.js ACL code
 */

// libs
var async = require('async');
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
 * @param  {Object} we
 * @param  {Function} cb callback
 */
acl.init = function initAcl (we, cb) {
  config = require('../staticConfig')(we.projectFolder);
  acl.permissions = we.config.permissions;

  // load roles and permissions in parallel
  async.parallel([
    function loadRoles(done) {
      acl.loadAllRoles(we, function(err, roles) {
        if (err) return done(err);
        acl.roles = roles;
        done();
      })
    }
  ], function(err) {
    if (err) return cb(err);
    // ensures that default roles are avaible
    acl.createDefaultRolesIfNotExists(we, function (err) {
      if (err) return cb(err);
      we.events.emit('we:acl:after:init', we);
      return cb();
    })
  });
};

/**
 * Function to check if one user has some permission
 *
 * @param  {string} permissionName
 * @param  {string} roleName
 * @param  {Function} callback
 */
acl.can = function userCan(permissionName, roleNames, callback) {
  // config for enable or disable ACL
  if ( config.acl.disabled ) return callback(null, true);
  var can = false;

  if ( roleNames.indexOf('administrator') > -1 ) return callback(null, true);

  for (var i = roleNames.length - 1; i >= 0; i--) {
    if (!acl.roles[roleNames[i]]) continue; // role not exists

    if (acl.roles[roleNames[i]].havePermission(permissionName)) {
      can = true;
      break;
    }
  }

  callback(null, can);
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

  if (!res.locals.permission || (res.locals.permission === true))
    return callback();

  // config for enable or disable ACL
  if ( we.config.acl.disabled ) return callback();

  acl.loadUserContextRoles(req, res, function(err) {
    if (err) return res.serverError(err);

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
}

acl.loadUserContextRoles = function loadUserContextRoles(req, res, cb) {
  if (req.userRolesIsLoad) return cb(null, req.userRoleNames);

  if (!req.user) {
    req.userRoleNames.push('unAuthenticated');
    return cb();
  }
  req.user.getRoles().then(function(roles) {
    roles.forEach(function (r) {
      if(req.userRoleNames.indexOf(r.name) == -1 ) req.userRoleNames.push(r.name);
    })

    req.userRoleNames.push('authenticated');
    req.userRolesIsLoad = true;

    cb(null, roles);
  }).catch(cb);
}

/**
 * Load all roles from DB
 * @param  {object} we
 * @param  {Function} cb  callback
 * @return {object} waterline find promisse
 */
acl.loadAllRoles = function loadAllRolesFromDB(we, cb) {
  return we.db.models.role.findAll()
  .then(function found(matchingRecords) {
    var roles = {};
    for (var i = matchingRecords.length - 1; i >= 0; i--) {
      roles[matchingRecords[i].name] = matchingRecords[i];
    }
    return cb(null, roles);
  });
}

/**
 * Check and create default roles required for all we.js projects
 *
 * @param  {object} we
 * @param  {Function} cb callback
 */
acl.createDefaultRolesIfNotExists = function createDefaultRolesIfNotExists(we, cb) {
  async.parallel([
    function unAuthenticatedRole(done) {
      acl.registerOneDefaltRole(we, 'unAuthenticated', done);
    },
    function authenticatedRole(done) {
      acl.registerOneDefaltRole(we, 'authenticated', done);
    },
    function ownerRole(done) {
      acl.registerOneDefaltRole(we, 'owner', done);
    },
    function administratorRole(done) {
      acl.registerOneDefaltRole(we, 'administrator', done);
    }
  ], cb)
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
  acl.createRole(we, { name: roleName }, done);
}

/**
 * Create and register one role
 *
 * @param {object} we.js object
 * @param  {object} data { name: 'roleName', ... } the new role object
 * @param  {Function} cb  callback
 */
acl.createRole = function createRole(we, data, cb) {
  // if not exists create the role
  return we.db.models.role.findOrCreate({
    where: data,
    defaults: data
  })
  .spread(function (role) {
    // set the role in global roles how will be avaible in sails.acl.roles
    acl.roles[data.name] = role;
    cb(null , role);
  }).catch(cb);
}

/**
 * DDelete one role and remove from roles array
 *
 * @param {object} we.js object
 * @param  {String} roleId
 * @param  {Function} cb  callback
 */
acl.deleteRole = function deleteRole(we, roleId, cb) {
  // if not exists delete the role
  return we.db.models.role.findById(roleId)
  .then(function (role) {
    role.destroy().then(function () {
      delete acl.roles[role.name];
      cb(null , role);
    })
  }).catch(cb);
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
  if (!we.acl.roles[roleName]) return cb( new Error('role not found') );
  we.acl.roles[roleName].addPermission(permissionName).then(function() {
    return cb(null, we.acl.roles[roleName]);
  }).catch(cb);
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
  if (!we.acl.roles[roleName]) return cb( new Error('role not found') );
  we.acl.roles[roleName].removePermission(permissionName).then(function() {
    return cb(null, we.acl.roles[roleName]);
  }).catch(cb);
}

module.exports = acl;