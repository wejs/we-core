
 var markedTextReged = new RegExp(/(@[a-z0-9][a-z0-9\-_]*)/ig);


 Ember.Handlebars.helper('marked-text', function(value, options) {
  var newText = value.replace(markedTextReged, '<mention data-username="$1" class="user-mention">$1</mention>');
  return new Ember.Handlebars.SafeString(newText);
});

Ember.Handlebars.helper('simple-text', function(value, options) {
  value = Handlebars.Utils.escapeExpression(value);
  value = value.replace(/(\r\n|\n|\r)/gm, '<br>');
  return new Handlebars.SafeString(value);
});
