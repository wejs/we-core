App.WeMenuComponent = Ember.Component.extend({
  menuName: 'main',

  tagName: 'ul',

  classNames: ['nav'],

  enableMetisMenu: false,

  didInsertElement: function () {
    this._super();
    teste = this;
    if(this.get('enableMetisMenu'))
    	this.$().metisMenu();
  },

  menu: function() {
    return  Ember.get(App, 'configs.client.publicVars.menus.' + this.get('menuName') );
  }.property('menuName')
});
