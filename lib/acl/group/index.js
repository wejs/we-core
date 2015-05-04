/**
 * Wwe.js group ACL
 */

var GACL = {};

var we;

GACL.init = function init(w) {
  we = w;
}

/**
 * Function to check if one user has some permission
 *
 * @param  {string} permissionName
 * @param  {string} roleName
 * @param  {Function} callback
 */
GACL.can = function userCan(groupPricacity, permissionName, roleNames, callback) {
  var can = false;
  if (roleNames.indexOf('administrator') > -1) return callback(null, true);
  if (roleNames.indexOf('manager') > -1) return callback(null, true);

  if (!we.config.groupPermissions[groupPricacity]) {
    we.log.warn('GACL.can: Invalid group pricacity: ', groupPricacity);
    return callback(null, false);
  }

  // return false if permission dont exists
  if (!we.config.groupPermissions[groupPricacity][permissionName])
    return callback(null, false);

  for (var i = roleNames.length - 1; i >= 0; i--) {
    if (we.config.groupPermissions[groupPricacity][permissionName].roles.indexOf(roleNames[i]) > -1 ) {
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
GACL.canMiddleware = function membershipCanMiddleware(req, res, callback) {
  if (!res.locals.group) return callback();
  if (!res.locals.groupPermission) return callback();

  var we = req.getWe();

  if (we.config.acl.disabled) return callback();

  we.acl.loadUserContextRoles(req, res, function (err) {
    if (err) return callback(err);
    // not is member
    if (!res.locals.membership) {
      if (res.locals.group.privacity != 'public') return res.forbidden();

    we.log.warn('>>>', res.locals.group.toJSON(), res.locals.groupPermission);
    we.log.warn('<<<<', req.userRoleNames);
    } else {
      GACL.can( res.locals.group.privacity, res.locals.groupPermission,
        res.locals.membership.roles.concat(req.userRoleNames),
      function(err, can) {
        if (err) return callback(err);
        if (!can) return res.forbidden();
        return callback();
     });
    }
  });
}

module.exports = GACL;