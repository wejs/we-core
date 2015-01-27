
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

  srcDone: '/core/images/done.png',
  srcLoading: '/core/images/loading.gif',

  textDone: 'Salved',
  textLoading: 'loading ...'
});
