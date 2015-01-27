/** Copyright 2014, Alberto Souza
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 * @todo  make this code simpler e easy do read
 *
 */

(function($, we, Ember) {

  // change we.events to use sails.js evented
  we.events = Ember.Object.extend(Ember.Evented).create();
  // enable query params
  ENV = {FEATURES: {'query-params-new': true}};
  Ember.FEATURES['query-params-new'] = true;
  // start app after
  window.App = Ember.Application.create({
    locale: we.config.language,
    // we.js notification manager
    //WeNotification: window.WeNotification.create(),
    currentUser: {}
  });

  App.deferReadiness();

  if ( !window.PRODUCTION_ENV ) {
    /**
     * App developement flags
     */
    App.reopen({
      // basic logging of successful transitions
      LOG_TRANSITIONS: true,
      // detailed logging of all routing steps
      LOG_TRANSITIONS_INTERNAL: true,
      LOG_VIEW_LOOKUPS: true,
    });
  }

  // add set body class on route change
  Ember.Route.reopen({
    activate: function() {
      var cssClass = this.toCssClass();
      // you probably don't need the application class
      // to be added to the body
      if (cssClass != 'application') {
        Ember.$('body').addClass(cssClass);
      }
    },
    deactivate: function() {
      Ember.$('body').removeClass(this.toCssClass());
    },
    toCssClass: function() {
      return this.routeName.replace(/\./g, '-').dasherize();
    }
  });

  // App.Router.reopen({
  //   location: 'history'
  // });

  // Ember breadcrumbs configs
  window.BreadCrumbs.BreadCrumbsComponent.reopen({
    tagName: 'ol',
    classNames: ['breadcrumb'],
    // use application/templates/components/bread-crumbs.hbs template
    layout: null
  });

  // add getMetaData function on model
  DS.Model.reopen({
    getMetaData: function () {
      return this.get('_data.meta');
    }
  });

  // i18n configs
  Ember.FEATURES.I18N_TRANSLATE_HELPER_SPAN = false;
  // add translations to all ember input fields
  Ember.View.reopen(Ember.I18n.TranslateableAttributes);
  Ember.Select.reopen(Ember.I18n.TranslateableProperties);

  // -- UTILS --
  we.utils.ember = {};

  /**
   *  Check if a emberjs array of object has te value atrib
   */
  we.utils.ember.arrayObjsHas = function(items, attrib, value) {
    if(!items){
      return false;
    }
    for (var i = 0; i < items.length; i++) {
      if(items[i].get(attrib) === value){
        return true;
      }
    }
    return false;
  };

  /**
   * Remove one item in array of objects by object id
   * @param  {array} items       array
   * @param  {string} idValue    id to search for
   * @return {object|bool}       return the removed object or false if the object not is found
   */
  we.utils.ember.arrayRemoveById = function(items, idValue) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === idValue) {
        //remove the item from array and
        //return the value and stop the execution
        return items.splice([i],1);
      }
    }
    // item not found in array
    return false;
  };

})(jQuery, we, Ember);