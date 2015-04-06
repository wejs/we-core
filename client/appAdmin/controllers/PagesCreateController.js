App.PagesCreateController = Ember.ObjectController.extend({
  breadCrumb: function(){
    return Ember.I18n.t('create');
  }.property('record')
});