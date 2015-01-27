
App.inject( 'component:we-admin-menu', 'router', 'router:main' );
// inject store
App.inject( 'component:we-admin-menu', 'store', 'store:main' );

App.WeAdminMenuComponent = Ember.Component.extend({
  models: null,
  classNames: ['nav','nav-colapsable'],
  tagName: 'ul',

  menuName: '',

  links: [],

  init: function() {
    this._super();
    var self = this;
    self.set('isLoading', true);

    if (!this.get('models')) {
      self.set('models', this.getModelNames());
    }

    $.ajax({
      type: 'GET',
      url: '/menu/admin'
    }).done(function(result) {
      self.set('menuName', result.menuName);
      self.set('links', result.links );
    }).fail(function(xhr, status, err){
      Ember.Logger.error(err)
    }).always(function() {
      self.set('isLoading', false);
    });
  },

  didInsertElement: function () {
    this._super();
    this.$().metisMenu();
  },

  modelLinks: function(){
    var models = this.get('models');
    var links = [];
    var router = this.get('router');
    var store = this.get('store');

    models.forEach(function(model){
      var routeName = store._normalizeTypeKey(model);
      if (router.hasRoute(routeName) ) {
        links.push({
          href: '',
          text: model,
          icon: '',
          model: routeName
        })
      }
    })
    return links;
  }.property('models'),

  getModelNames: function getModelNames() {
    var models = [];
    for (var key in App) {
      var value = App[key],
          superClass = value ? value.superclass : undefined;
      if (superClass && superClass === DS.Model) {
        models.push(key);
      }
    }
    return models;
  },
  actions: {
    goToModel: function(modelName) {
      this.router.transitionTo('model', modelName);
    }
  }
});

