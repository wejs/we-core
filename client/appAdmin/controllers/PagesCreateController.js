App.PagesCreateController = Ember.ObjectController.extend({

  isSaving: false,

  showModelSelector: function() {
    if(this.get('record.type') == 'resource')
      return true;

    return false;
  }.property('record.type'),

  typeOptions: [
    {
      value: 'route',
      label: 'Route'
    },
    {
      value: 'resource',
      label: 'Resource'
    }
  ],

  actions: {
    createRecord: function(){
      var self = this;
      var record = this.get('record');

      self.set('isSaving', true);

      record.save().then(function(r) {
        self.set('isSaving', false);
        self.transitionToRoute('page', r.id);
      });
    }
  }
});