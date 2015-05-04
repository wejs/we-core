
App.WeLoadingComponent = Ember.Component.extend({
  tagName: 'span',

  text: function (){
    if( this.get('isLoading')) {
      return this.get('textLoading');
    } else {
      return this.get('textDone');
    }
  }.property('isLoading'),

  src: function(){
    if( this.get('isLoading')) {
      return this.get('srcLoading');
    } else {
      return this.get('srcDone');
    }
  }.property('isLoading'),

  init: function() {
    this._super();
    if (!this.get('textDone') || this.get('textLoading'));

    this.setProperties({
      textDone: Ember.I18n.t('loaded'),
      textLoading: Ember.I18n.t('loading')
    });
  },

  srcDone: '/public/plugin/we-core/files/images/done.png',
  srcLoading: '/public/plugin/we-core/files/images/loading.gif'
});
