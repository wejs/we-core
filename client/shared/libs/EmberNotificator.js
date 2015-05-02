/**
 * Ember.js device notificator
 */

Ember.Notificator = Ember.Object.extend({
  defaultTitle: '',

  hasBrowserNotificationsPermissions: false,

  hasPermissions: function hasPermissions() {
    // Let's check if the user is okay to get some notification
    if (window.Notification.permission === 'granted') {
      // If it's okay let's create a notification
      return 'granted';
    } else if(window.Notification.permission !== 'denied'){
      // need to ask the user for permission
      return window.Notification.permission;
    }
    // permission denited by user
    return false;
  },

  init: function init() {

    // Let's check if the browser supports notifications
    if (!('Notification' in window)) {
      console.info('This browser does not support desktop notification');
      return;
    }

    // store default page title
    this.set('defaultTitle', $('title') );

    var permission = this.hasPermissions();
    if( permission ) {
      if( permission === 'granted') {
        // can notify
      } else {
        this.requestPermission();
      }
    }
  },
  createNotification: function() {
    if (this.hasPermissions()) {
      return notification = new Notification('title', {
        icon: '/core/images/we-logo-branco-small.png',
        body: 'notification body',
        onclick: function(){
          console.warn('clicou na notificação');
        }
      });
    }
  },
  requestPermission: function(){
    // request the permission
    Notification.requestPermission(function (permission) {
      // Whatever the user answers, we make sure we store the information
      if (!('permission' in Notification)) {
        Notification.permission = permission;
      }
    });
  },
  setNewPageTitle: function(count) {
    if (!count) {
      count = 0;
    }

    var newtitle = '(' + count + ') ' + this.get('defaultTitle')
    $('title').text(newtitle);
  }
});
