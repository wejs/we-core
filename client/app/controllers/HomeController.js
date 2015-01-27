
App.HomeController = Ember.ObjectController.extend({
  title: function() {
    return App.appName;
  }.property('App.appName'),
  subTitle: function() {
    return App.appAbout;
  }.property('App.appAbout'),

  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser')
});
