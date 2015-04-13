App.WeGroupJoinButtonComponent = Ember.Component.extend({
  layout: Ember.Handlebars.compile('{{icon}}{{view.label}}'),

  tagName: 'button',

  icon: '',

  attributeBindings: ['disabled'],
  disabled: false,

  classNameBindings: ['status'],

  status: null,

  label: function(){
    switch(this.get('status')){
      case 'invited':
        return Ember.I18n.t('membership.button.invited');
      case 'active':
        return Ember.I18n.t('membership.button.active');
      case 'requested':
        this.set('disabled', true);
        return Ember.I18n.t('membership.button.requested');
      // case 'blocked':
      default:
        return Ember.I18n.t('membership.button.request');
    }
  }.property('status'),

  click: function(){
    this.sendAction();
  }
});