
(function($, we, Ember){

  Ember.Handlebars.helper('format-date', function(date) {
    return moment(date).fromNow();
  });

  // Limit string length
  // usage: {{substr description max=20}}
  // or {{substr description start=5 max=20}}
  Ember.Handlebars.registerHelper('substr', function(property, options) {

    var str = Ember.get(this, property);

    if(!str) return '';

    var opts = options.hash;

    var start = opts.start || 0;
    var len = opts.max;

    var out = str.substr(start, len);

    if (str.length > len)
        out += '...';

    return new Handlebars.SafeString(out);
  });

})(jQuery, we, Ember);