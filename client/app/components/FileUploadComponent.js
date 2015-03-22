(function($, Ember, App){

  App.FileUploadComponent = Ember.FileField.extend({
    mimeTypes: null,
    extensions: null,
    files: []
  });

})(jQuery, Ember, App);