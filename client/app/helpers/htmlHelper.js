Ember.Handlebars.helper('html', function(value) {
  if (!value) return '';
  return new Handlebars.SafeString(value);
});
