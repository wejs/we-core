App.WeMenuComponent = Ember.Component.extend({
  menuName: 'main',

  tagName: 'ul',

  classNames: ['nav'],

  enableMetisMenu: false,

  didInsertElement: function () {
    this._super();
    if(this.get('enableMetisMenu'))
      this.$().metisMenu();
  },

  menu: function() {
    return  Ember.get(App, 'configs.client.publicVars.menus.' + this.get('menuName') );
  }.property('menuName'),

  filteredLinks: function (){
    var currentUserRoles = Permissions.currentUserRolesWithProp('name');

    // filter links if current user not is admin
    if (currentUserRoles.indexOf('administrator') === -1) {

      var restrictAccess = this.get('menu.restrictAccess');

      return this.get('menu.links').filter(function (link) {
        if (!link.roles) return (!restrictAccess);
        var intersection = window._.intersection(link.roles, currentUserRoles);
        return intersection.length;
      });
    } else {
      return this.get('menu.links');
    }
  }.property('menu')
});
