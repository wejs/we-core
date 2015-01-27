App.WeMenuComponent = Ember.Component.extend({
  menuName: 'main',

  tagName: 'ul',

  classNames: ['nav'],

  menu: function() {
    return  Ember.get(App.configs.client.publicVars.menus, this.get('menuName') );
  }.property('menuName')
});
