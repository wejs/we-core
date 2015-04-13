App.GroupAboutController = Ember.ObjectController.extend(App.GroupSaveAttributeMixin, {
  breadCrumb: 'Sobre',
  vocabularyId: function() {
    return App.get('vocabularyId');
  }.property('App.vocabularyId')
});

