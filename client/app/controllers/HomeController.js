
App.HomeController = Ember.ObjectController.extend({
  title: function() {
    document.title = App.get('configs.appName');
    return App.get('configs.appName');
  }.property('App.configs.appName'),
  subTitle: function() {
    return App.get('configs.client.publicVars.appAbout');
  }.property('App.configs.client.publicVars.appAbout'),

  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser')
});
