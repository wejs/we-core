App.RegionsListController = Ember.ArrayController.extend({
  sortProperties: ['order'],
  sortAscending: true,
  itemController: 'region'
});