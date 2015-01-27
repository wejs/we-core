App.PageRegionsController = Ember.ArrayController.extend({
  needs: 'page',
  page: Ember.computed.alias('controllers.page.model.record'),

  sortProperties: ['order'],
  sortAscending: true,
  itemController: 'region',

  actions: {
    openAddModalWidget: function openAddModalWidget(region) {
      var page = this.get('page');


    }
  }
});