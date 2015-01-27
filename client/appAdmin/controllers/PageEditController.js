App.PageEditController = Ember.ObjectController.extend({

  breadCrumb: 'edit',

  isSaving: false,

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
    saveRecord: function() {
      var self = this;
      this.set('isSaving', true);

      this.get('record.content').save().then(function(r) {
        self.set('isSaving', false);
        self.get('target').transitionTo('page.index', r.id)
      })
    },

    cancelEdit: function () {
      var record = this.get('record.content');
      record.rollback();
      this.get('target').transitionTo('page.index', record.id)
    },

    deleteRecord: function () {
      this.set('isSaving', true);
    }
  }
});