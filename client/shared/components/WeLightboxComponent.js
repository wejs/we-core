
App.WeLightboxComponent = Ember.Component.extend({
  tagName: 'a',
  href: null,
  'data-lightbox': function dataLightbox() {
    if (this.get('ligthBoxName')) {
      return this.get('ligthBoxName');
    } else {
      return null;
    }
  }.property('ligthBoxName'),
  ligthBoxName: null,
  attributeBindings: ['href', 'data-lightbox'],
});