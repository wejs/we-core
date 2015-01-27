
App.WeRolePermissionCheckboxComponent = Ember.Component.extend({
  tagName: 'td',
  role: null,
  permission: null,

  started: false,

  isSaving: false,

  willInsertElement: function() {
    this._super();

    var roleName = this.get('role.name');
    var permissionRoles = this.get('permission.roles').toArray();
    var has = false;

    for (var i = permissionRoles.length - 1; i >= 0; i--) {
      if ( Ember.get(permissionRoles[i], 'name' ) === roleName) {
        has = true;
        break;
      }
    };

    this.set('hasPermission', has);

    this.set('started', true);
  },

  onChangePermission: function() {
    if(!this.get('started')) return;
    this.send('changePermission');
  }.observes('hasPermission'),

  actions: {
    changePermission: function() {
      var flag = this.get('hasPermission');
      var role = this.get('role');
      var permission = this.get('permission');
      var self = this;
      this.set('isSaving', true);

      if (flag) {
        // add
        permission.get('roles').pushObject(role);
      } else {
        // remove
        permission.get('roles').removeObject(role);

      }

      permission.save()
      .then(function() {
        self.set('isSaving', false);
      })

    }
  }
});