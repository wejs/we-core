App.VocabularyCreateController = Ember.ObjectController.extend({
  messages: [],
  actions: {
    create: function createOne() {
      var self = this;
      var store = this.get('store');

      var vocabulary = this.get('model.vocabulary');
      if (!vocabulary.name) {
        // TODO
        console.warn('vocabulary is required');
        return;
      }

      store.find('user', App.currentUser.id)
      .then(function (user) {

        var record = store.createRecord('vocabulary', vocabulary);

        record.setProperties({
          'creator': user
        });

        record.save()
        .then(function(v) {
          // after create redirect to vocabulary page
          self.transitionToRoute('vocabulary', v.id);
        })
        .catch(function (err) {
          Ember.Logger.error('Error on create vocabulary',err);
        })

      });
    },

    cancel: function() {

    }
  }

});