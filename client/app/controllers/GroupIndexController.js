
App.GroupIndexController = Ember.ObjectController.extend(App.GroupSaveAttributeMixin, {
  isLoading: false,

  vocabularyId: function() {
    return App.get('vocabularyId');
  }.property('App.vocabularyId'),

  currentUser: function () {
    return App.get('currentUser');
  }.property('App.currentUser'),

  actions:{
    newPost: function newPost () {},

    saveCategories: function() {
      var self = this;
      var group = self.get('group');

      self.set('isLoading', true);

      group.save().then(function() {
        self.set('isLoading', false);
      }).catch(function(err){
        Ember.Logger.error('Error on save group saveCategories', err);
        self.set('isLoading', false);
      });
    },
    saveTags: function() {
      this.send('saveCategories');
    }
  }
});