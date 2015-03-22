// App.User = DS.Model.extend({

//   autor: DS.hasMany('relato', {inverse: 'autores'}),
//   ator: DS.hasMany('relato', {inverse: 'atores'}),

// });

App.UserAdapter = App.ApplicationRESTAdapter.extend();

// App.UserSerializer = DS.RESTSerializer.extend({
//   primaryKey: 'idInProvider'
// });

$(function() {
  App.User.reopen({
    avatar:  DS.belongsTo( 'image', {
      async: true,
      inverse: 'avatarOf'
    }),

    images:  DS.belongsTo( 'image', {
      async: true,
      inverse: 'creator'
    }),

    biographyClean: function() {
      var text = this.get('biography')
      if(!text) return '';
      return text.replace(/(<([^>]+)>)/ig,'')
    }.property('biography'),

  });

  App.Image.reopen({
    avatarOf:  DS.hasMany( 'user', {
      async: true,
      inverse: 'avatar'
    }),
  })
});