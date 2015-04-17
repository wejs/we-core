App.WeModalComponent = Ember.Component.extend({
  init: function (){
    this._super.apply(this, arguments);
    if ( Ember.isNone(this.get('okInvalid')) ) this.set('okInvalid', false);

    if (this.get('delegate')) {
      this.get('delegate').set(this.get('property') || 'WeModal', this);
    }
  },

  actions: {
    ok: function() {
      this.$('.modal').modal('hide');
      this.sendAction('ok');
    }
  },

  closeModal: function (){
    this.$('.modal').modal('hide');
  },

  show: function() {
    this.$('.modal').modal().on('hidden.bs.modal', function() {
      this.sendAction('close');
    }.bind(this));
  }.on('didInsertElement')
});