App.PagesController = Ember.ObjectController.extend({
  breadCrumb: function(){
    return Ember.I18n.t('pages');
  }.property('records'),
});


