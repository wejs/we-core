/**
 * Permissions object
 *
 * Global permissions mananger used in can helpers of current user permissions check
 */

Permissions = {
  /**
   * Permissions cache object
   * @type {Object}
   */
  _perms:    {},

  /**
   * Register all permissions used in app init
   * @param  {array}
   */
  registerAll: function(perms) {
    for (var i = perms.length - 1; i >= 0; i--) {
      this._perms[ Ember.get(perms[i], 'name') ] = perms[i];
    }
  },

  /**
   * Register one permission
   * @param  {string} name
   * @param  {object} perm
   */
  register: function(name, perm) {
    this._perms[name] = perm;
  },

  /**
   * get one permission from permissions cache
   *
   * @param  {string}
   * @return {object}
   */
  get: function(name) {
    return this._perms[name];
  },
  /**
   * default template can name
   *
   * @param  {string} permissionName
   * @return {string}
   */
  makeCanName: function(permissionName, modelName, model) {
    if (modelName && model) {
      var modelId = Ember.get(model, 'id');
      return 'can_' + permissionName + '_' + modelName + '_' + modelId;
    }
    return 'can_' + permissionName;
  },

  /**
   * Default roles
   *
   * @type {Object}
   */
  defaultRoles: {
    authenticated: 'authenticated',
    unAuthenticated: 'unAuthenticated',
    owner: 'owner',
    administrator: 'administrator'
  },

  currentUserRolesCache: null,

  /**
   * Can cache variable
   * @type {Object}
   */
  canCache: {},

  /**
   * get current user roles
   * @return {array}
   */
  currentUserRoles: function() {
    var roles = [];

    // cache var
    if (Permissions.currentUserRolesCache) {
      return Permissions.currentUserRolesCache;
    }

    // if dont have cache
    // unAuthenticated
    if ( !App.get('currentUser.id') ) {
      return [ Permissions.defaultRoles.unAuthenticated ];
    }

    var rolesObj = App.get('currentUser.roles').toArray();

    for (var i = rolesObj.length - 1; i >= 0; i--) {
      roles.push(Ember.get(rolesObj[i], 'name'));
    }

    roles.push(Permissions.defaultRoles.authenticated);

    Permissions.currentUserRolesCache = roles;

    return roles;
  },

  /**
   * Check if currentUser can do something
   *
   * @param  {string} permission name
   * @param  {object} attributes
   * @return {boolean} true for allow and false for block
   */
  can: function(name, modelName, model) {
    if (App.configs.acl.disabled) return true;
    // admin users has all permissions
    if ( App.get('currentUser.isAdmin')) return true;

    var canName = Permissions.makeCanName(name, modelName, model);

    // check if has a can cache
    if (typeof(Permissions.canCache[canName]) !== 'undefined' )
      return Permissions.canCache[canName];

    // load roles
    var roles = Permissions.currentUserRoles();
    // add owner role
    if (Permissions.isOwner(modelName, model))
      roles.push(Permissions.defaultRoles.owner);

    // return true if has admin role
    if ( roles.indexOf('administrator') > -1 ) return true;

    var permission = Permissions.get(name);
    if (!permission) {
      // set cache and return
      return Permissions.canCache[canName] = false;
    }

    var permissionRoles = permission.roles;

    // return false if this permission dont have roles
    if (!permissionRoles || permissionRoles.length < 1) {
      return false;
    }

    for (var i = permissionRoles.length - 1; i >= 0; i--) {
      if ( roles.indexOf(permissionRoles[i]) > -1 ) {
        return Permissions.canCache[canName] = true;
      }
    }
    return Permissions.canCache[canName] = false;
  },

  /**
   * Check if user owns one content
   *
   * @param  {string} modelName
   * @param  {object} model
   * @return {Boolean}
   */
  isOwner: function(modelName, model) {
    var currentUserId = App.get('currentUser.id');
    if (!currentUserId || !model) return false;

    if (modelName === 'user') {
      if (model.id == App.get('currentUser.id')) {
        return true;
      }
    } else {
      var creator = Ember.get(model, 'creator');
      if (creator) {
        var creatorId;
        if (typeof creator == 'object') {
          creatorId = Ember.get(creator, 'id');
        } else {
          creatorId = creator;
        }

        if (creatorId == currentUserId) return true;
      }
    }
    // defaults to false
    return false;
  },

  rolesIsLoaded: false,

  /**
   * Load and register all roles, use in app bootstrap
   *
   * @param  {Object} store Ember data store
   * @return {Object}       Promisse Ember.RSVP
   */
  loadAndRegisterAllRoles: function(store) {
    if (Permissions.rolesIsLoaded) return Ember.RSVP.resolve();

    return new Ember.RSVP.Promise(function(resolve, reject) {
      var rolesUrl = '/role';
      var host = Ember.get('App.configs.permissionHost');
      if ( host ) {
        rolesUrl = host + rolesUrl;
      }

      return $.getJSON( rolesUrl )
      .done(function afterLoadData(data) {
        if (data.role) {
          store.pushMany('role', data.role);
          data.role.forEach(function(role) {
            Permissions.defaultRoles[role.name] = role.name;
          })

          Permissions.rolesIsLoaded = true;
        }

        resolve();
      })
      .fail(function (result) {
        if (result.status == '403') return resolve();
        Ember.Logger.error('Error on load roles' , result);

        return reject(result);
      })
    });
  },

  /**
   * Load and register all permissions and roles, use in app bootstrap
   *
   * @param  {Object} store Ember data store
   * @return {Object}       Promisse Ember.RSVP
   */
  loadAndRegisterAllPermissions: function(store) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      var permissionsUrl = '/permission';
      var permissionsHost = Ember.get('App.configs.permissionHost');
      if ( permissionsHost ) {
        permissionsUrl = permissionsHost + permissionsUrl;
      }

      return $.getJSON( permissionsUrl )
      .done(function afterLoadData(data) {
        if (data.permission) {
          // register all permissions
          Permissions.registerAll(data.permission);
        }

        // on success
        resolve(Permissions._perms);
      })

      .fail(function (result) {
        if (result.status == '403') return resolve(Permissions._perms);

        Ember.Logger.error('Error on load permissions' , result);
        // on failure
        return reject(result);
      })
    });
  },

  loadAndRegisterAllRolesAndPermissions: function(store) {
    return new Ember.RSVP.hash({
      roles: Permissions.loadAndRegisterAllRoles(store),
      permissions: Permissions.loadAndRegisterAllPermissions(store),
    });
  }
};