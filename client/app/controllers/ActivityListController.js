App.ActivityListController = Ember.ArrayController.extend({
  sortProperties: Ember.computed.oneWay('parentController.sortProperties'),
  sortAscending: Ember.computed.oneWay('parentController.sortAscending'),
  count: Ember.computed.oneWay('parentController.count'),
  activityIsLoading: Ember.computed.oneWay('parentController.isSearching')
});
