
App.WeImageOverlayComponent = Ember.Component.extend({
  tagName: 'a',
  href: null,
  classNames: ['fancybox'],
  didInsertElement: function() {
    this._super();

    // TODO create one galery component
    var group = this.get('data-fancybox-group');

    $('a[data-fancybox-group='+group+']').fancybox({
      openEffect  : 'none',
      closeEffect : 'none',
      helpers: {
        overlay: {
          locked: false
        }
      }
    });

  },

  attributeBindings: ['href', 'data-fancybox-group'],
});
