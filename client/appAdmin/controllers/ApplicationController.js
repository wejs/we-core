
App.ApplicationController = Ember.ObjectController.extend({
  breadCrumb: 'Inicio',
  isAuthenticated: function(){
    if(App.auth.get('isAuthenticated') ) {
      return true;
    }else{
      return false;
    }
  }.property('App.auth.isAuthenticated'),

  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser')
});
