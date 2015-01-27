
App.VocabularyIndexController = Ember.ObjectController.extend({
  showCreateTermForm: false,
  actions: {
    showCreateTermForm: function showCreateTermForm() {
      this.set('showCreateTermForm', true);
    },

    hideCreateTermForm: function hideCreateTermForm() {
      this.set('showCreateTermForm', false);
    },

    createTerm: function createTerm() {
      var self = this;
      var newTerm = this.get('model.newTerm');
      var vocabulary = this.get('model.vocabulary');
      var store = this.get('store');

      store.find('user', App.currentUser.id)
        .then(function (user) {

        var term = store.createRecord('term', newTerm);
        term.setProperties({
          'creator': user,
          'vocabulary': vocabulary
        });

        term.save()
        .then(function() {
          self.send('afterTermCreated');
        })
        .catch(function (err) {
          Ember.Logger.error('Error on create term', err, term, vocabulary);
        })
      })
    },

    afterTermCreated: function () {
      this.send('hideCreateTermForm');
    }
  }
});
