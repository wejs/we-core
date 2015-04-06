
App.CommentsListController = Ember.ArrayController.extend({
  sortProperties: ['createdAt'],
  sortAscending: true,

  auth: function() {
    return App.auth;
  }.property('App.auth')
});