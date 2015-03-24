
App.WeTermEditableComponent = Ember.Component.extend({
  tagName: 'span',
  classNames: ['editable-field'],
  displayTag: 'div',
  isEditing: false,

  // value to show
  value: '',
  // backup value to alow a cancel mecanism
  backupValue: null,

  onSave: 'save',

  didInsertElement: function() {
    this._super();
    this.activeTootip();
  },

  activeTootip: function() {
    this.$('.tooltip').tooltip();
  },

  actions: {
    openEditing: function () {
      this.set('backupValue', this.get('value'));
      this.set('isEditing', true);
    },
    saveEditing: function () {
      this.set('isEditing', false);
      this.sendAction('onSave');
      this.activeTootip();
      //$('#example').tooltip(options)
    },

    cancelEditing: function () {
      this.set('isEditing', false);
      // reset value
      this.set('value', this.get('backupValue'));
    }
  }
});