App.RolesCreateController = Ember.ObjectController.extend({
  breadCrumb: 'criar',

  checkName: function (){
    var roleName = /^[a-zA-Z]+$/;
    if ( !roleName.test(this.get('model.role.name')) ) return this.set('nameErr', true);
    this.set('nameErr', false);
  }.observes('model.role.name'),

  formInvalid: function (){
    var bool = Boolean( this.get('nameErr') || Ember.isEmpty(this.get('model.role.name')) );

    return bool;
  }.property('nameErr'),

  actions: {
    create: function (){
      var self = this;
      var store = this.get('store');

      var role = this.get('model.role');
      if (!role.name) {
        // TODO
        console.warn('role name is required');
        return;
      }

      var newRole = store.createRecord('role', role);

      var onSuccess = function(role) {
        console.log('Role criada: ', role.name);
        self.transitionToRoute('roles.index');
      };

      var onFail = function(post) {
        newRole.rollback();
        console.log('Erro na criação da role: ', role.name);
      };

      newRole.save().then(onSuccess, onFail);
    }
  }
});
