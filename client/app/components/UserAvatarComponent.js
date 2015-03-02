/**
 * Ember.js user avatar image component visualizer
 *
 * @author Alberto Souza <alberto@wejs.org>
 *
 * @examples
 *   {{user-avatar user=record.creator size="thumbnail"}}
 *   {{user-avatar user=record.creator size="large"}}
 *
 */

App.UserAvatarComponent = Ember.Component.extend({
  tagName: 'img',

  // default configs
  width: '100%',
  attributeBindings: ['src','width', 'data-lightbox'],
  webp: 'auto',
  // medium | thumbnail | original | large
  size: 'medium',
  classNames: ['thumbnail'],
  defaultSrc: '/core/images/avatars/user-avatar.png',
  src: null,
  url: null,

  user: null,

  onClick: null,

  // observer to change image after resolves the image object promisse
  refreshImage: function refreshImage() {
    var src = this.get('user.avatar.urls.' + this.get('size') );
    if (src) {
      this.set('src',  src);
    } else {
      this.set('src', this.get('defaultSrc') );
    }
  }.observes('user.avatar.urls', 'user.avatar.id').on('init'),
  // optional onClick event
  click: function() {
    if (this.get('onClick')) {
      this.sendAction('onClick', this.get('user'), this);
    }
  }
});
