App.WeSubmenuComponent = Ember.Component.extend({
  links: null,
  text: null,
  
  tagName: 'ul',

  attributeBindings: ['expanded:aria-expanded'],
   
  expanded: 'false',

  classNames: ['nav nav-second-level collapse']
});
