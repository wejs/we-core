App.LayoutsCreateController = Ember.ObjectController.extend({

  isSaving: false,

  actions: {
    createRecord: function(){
      var self = this;
      var record = this.get('record');

      self.set('isSaving', true);

      record.save().then(function(r) {
        self.set('isSaving', false);
        self.transitionToRoute('layout', r.id);
      });
    }
  }
});