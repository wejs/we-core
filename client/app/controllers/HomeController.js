
App.HomeController = Ember.ObjectController.extend({
  title: function() {
    return App.get('configs.client.publicVars.appName');
  }.property('App.configs.client.publicVars.appName'),
  subTitle: function() {
    return App.get('configs.client.publicVars.appAbout');
  }.property('App.configs.client.publicVars.appAbout'),

  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser')
});
