App.GroupsIndexController = Ember.ArrayController.extend({
  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser')
});