App.WeBtnRecordDeleteComponent = Ember.Component.extend({
  tag: 'button',

  record: null,
  confirmText: 'Are you sure?',

  click: function() {
    this.send('deleteRecord');
  },

  actions: {
    deleteRecord: function() {
      if (confirm(this.get('confirmText'))) {
        this.get('record').destroyRecord();
      }
    }
  }
});