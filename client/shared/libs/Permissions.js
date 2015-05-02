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
  roles: {},

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
      return [ 'unAuthenticated' ];
    }

    var rolesObj = App.get('currentUser.roles').toArray();

    for (var i = rolesObj.length - 1; i >= 0; i--) {
      roles.push(Ember.get(rolesObj[i], 'name'));
    }

    roles.push('authenticated');

    Permissions.currentUserRolesCache = roles;

    return roles;
  },

  /**
   * get current user roles property
   * @return {array}
   */
  currentUserRolesWithProp: function(prop) {
    var roles = [];
    var property = prop || 'name';

    // unAuthenticated
    if ( !App.get('currentUser.id') ) {
      return [ Permissions.roles.unAuthenticated[property] ];
    }

    var rolesObj = App.get('currentUser.roles').toArray();

    for (var i = rolesObj.length - 1; i >= 0; i--) {
      roles.push(Ember.get(rolesObj[i], property));
    }

    if (Permissions.roles.authenticated)
      roles.push(Permissions.roles.authenticated[property]);

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
    if (typeof(Permissions.canCache[canName]) !== 'undefined' ) return Permissions.canCache[canName];

    // load roles
    var roles = Permissions.currentUserRoles();
    // add owner role
    if (Permissions.isOwner(modelName, model)) roles.push('owner');

    // return true if has admin role
    if ( roles.indexOf('administrator') > -1 ) return true;

    // return false if this permission dont have roles
    if (!Permissions.roles) return false;

    for (var i = roles.length - 1; i >= 0; i--) {
      if (!Permissions.roles[roles[i]]) continue;
      if (Permissions.roles[roles[i]].permissions && Permissions.roles[roles[i]].permissions.indexOf(name) >= 0) {
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
    if (!model.id) return true; // recent created model

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
          // save roles in store
          store.pushPayload({ role: data.role });

          data.role.forEach(function(role) {

            Permissions.roles[role.name] = role;
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

  // /**
  //  * Load and register all permissions and roles, use in app bootstrap
  //  *
  //  * @param  {Object} store Ember data store
  //  * @return {Object}       Promisse Ember.RSVP
  //  */
  // loadAndRegisterAllPermissions: function(store) {
  //   return new Ember.RSVP.Promise(function(resolve, reject) {
  //     var permissionsUrl = '/permission';
  //     var permissionsHost = Ember.get('App.configs.permissionHost');
  //     if ( permissionsHost ) {
  //       permissionsUrl = permissionsHost + permissionsUrl;
  //     }

  //     return $.getJSON( permissionsUrl )
  //     .done(function afterLoadData(data) {
  //       if (data.permission) {
  //         // register all permissions
  //         Permissions.registerAll(data.permission);
  //       }

  //       // on success
  //       resolve(Permissions._perms);
  //     })

  //     .fail(function (result) {
  //       if (result.status == '403') return resolve(Permissions._perms);

  //       Ember.Logger.error('Error on load permissions' , result);
  //       // on failure
  //       return reject(result);
  //     })
  //   });
  // },

  loadAndRegisterAllRolesAndPermissions: function(store) {
    return new Ember.RSVP.hash({
      roles: Permissions.loadAndRegisterAllRoles(store),
      // permissions: Permissions.loadAndRegisterAllPermissions(store),
    });
  }
};