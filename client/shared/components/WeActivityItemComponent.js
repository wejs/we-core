App.inject( 'component:we-activity-item', 'store', 'store:main' );

App.WeActivityItemComponent = Ember.Component.extend({
  isLoading: true,
  activity: null,
  record: null,

  classNames: [ 'activity-item' ],
  classNameBindings: ['isRecordLoaded:loaded:loading'],

  isRecordLoaded: function() {
    if (this.get('activity.relatedRecord')) return true;
    return false;
  }.property('activity.relatedRecord')
});