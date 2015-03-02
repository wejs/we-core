App.WeContentEditableComponent = Ember.Component.extend({
  classNames: ['editable-field'],
  displayTag: 'div',
  isEditing: false,
  canEdit: true,

  editButtonClass: 'btn btn-xs btn-primary',

  // value to show
  value: '',
  // backup value to alow a cancel mecanism
  backupValue: null,

  onSave: 'save',

  didInsertElement: function() {
    this._super();
  },

  actions: {
    openEditing: function () {
      this.set('backupValue', this.get('value'));
      this.set('isEditing', true);
    },
    saveEditing: function () {
      this.set('isEditing', false);
      this.sendAction('onSave', this.get('attribute'), this.get('value'));
    },

    cancelEditing: function () {
      this.set('isEditing', false);
      // reset value
      this.set('value', this.get('backupValue'));
    }
  }
});