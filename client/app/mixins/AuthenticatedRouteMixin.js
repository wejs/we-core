App.AuthenticatedRouteMixin = Ember.Mixin.create({
  beforeModel: function(transition, queryParams) {
    this._super();
    if ( !App.get('currentUser.id') ) {
      transition.abort();
      this.transitionTo( this.get('unauthenticatedRedirect') );
    }
  },

  unauthenticatedRedirect: 'home'
});
