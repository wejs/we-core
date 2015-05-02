/**
 * Ember.js image component visualizer
 *
 * @author Alberto Souza <alberto@wejs.org>
 *
 * @examples
 *   {{we-image file=imageModel size="medium"}}
 *   {{we-image src=imageSrc size="medium"}}
 */

App.WeImageComponent = Ember.Component.extend({
  tagName: 'img',

  // default configs
  width: '100%',
  attributeBindings: ['src','width', 'data-lightbox'],
  webp: 'auto',
  // medium | thumbnail | original | large
  size: 'medium',
  classNames: ['thumbnail'],
  defaultSrc: '/core/images/blank-image.jpg',
  src: null,
  url: null,
  file: null,

  // observer to change image after resolves the image object promisse
  refreshImage: function refreshImage() {
    var src = this.get('file.urls.' + this.get('size') );
    if (src) {
      this.set('src',  src);
    } else {
      this.set('src', this.get('defaultSrc') );
    }
  }.observes('file.urls', 'file.id'),

  init: function initImage() {
    this._super();

    // if dont have url or src get it from file object
    if (!this.get('src') || !this.get('url')) {
      //var file = this.get('file');
      var size = this.get('size');

      var src = this.get('file.urls.'+size);
      if (src) {
        this.set('src',src);
      } else {
        this.set('src', this.get('defaultSrc') );
      }
    }
  },

  // optional onClick event
  click: function() {
    if (this.get('onClick')) {
      this.sendAction('onClick', this.get('file'), this);
    }
  }
});
