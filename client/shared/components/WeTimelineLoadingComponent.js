/**
 * we-timeline-loading
 *
 * {{we-timeline-loading loadingMore=loadingMore haveMore=haveMore}}
 */

App.WeTimelineLoadingComponent = Ember.Component.extend({
  onGetMore: 'getMore',

  actions: {
    getMore: function() {
      this.sendAction('onGetMore');
    }
  }
});