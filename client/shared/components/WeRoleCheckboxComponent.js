
App.WeRolePermissionCheckboxComponent = Ember.Component.extend({
  tagName: 'span',
  role: null,
  permissionName: null,

  started: false,

  isSaving: false,

  willInsertElement: function() {
    this._super();

    var rolePermissions = this.get('role.permissions');
    var permissionName = this.get('permissionName');
    var has = false;

    if ( rolePermissions.indexOf(permissionName) > -1 ) has = true;

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
      var permissionName = this.get('permissionName');
      var self = this;
      this.set('isSaving', true);

      if (flag) {
        // add
        role.get('permissions').push(permissionName);
      } else {
        // remove
        role.get('permissions').removeObject(permissionName);
      }

      role.save().then(function() {
        self.set('isSaving', false);
      });
    }
  }
});