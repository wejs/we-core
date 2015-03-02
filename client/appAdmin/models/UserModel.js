// wait document ready ...
$( document ).ready(function() {
  // extend to add categorias attr
  App.User = App.User.extend({
    avatar: DS.belongsTo('images', {async: true}) 
  })
});