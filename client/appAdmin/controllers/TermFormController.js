App.TermFormController = Ember.ObjectController.extend({
  actions: {
    createRecord: function createTerm() {
      var self = this;
      var record = this.get('record');
      var vocabulary = this.get('vocabulary');
      var store = this.get('store');

      store.find('user', App.currentUser.id)
        .then(function (user) {

        var term = store.createRecord('term', record);
        term.setProperties({
          'creator': user
        });

        console.warn('v', vocabulary);

        if (vocabulary.id) {
         term.set('vocabulary', vocabulary);
        }

        term.save()
        .then(function() {
          self.transitionTo('vocabulary', vocabulary.id);
        })
        .catch(function (err) {
          Ember.Logger.error('Error on create term', err, term, vocabulary);
        })
      })
    },

  }
});
