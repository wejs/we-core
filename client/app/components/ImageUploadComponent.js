(function($, Ember, App){
  App.ImageUploadComponent = Ember.FileField.extend({
    accept: 'image/x-png, image/gif, image/jpeg',
    files: []
  });

})(jQuery, Ember, App);