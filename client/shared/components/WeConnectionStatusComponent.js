(function($, we, Ember, App){
  App.WeConnectionStatusComponent = Ember.Component.extend({
    classNameBindings: ['elementClassName', 'status'],
    tagName: 'span',
    isConnected: false,
    elementClassName: 'weConnectionStatusArea',
    status: Ember.I18n.t('disconected'),
    statusImageUrl: function(){
      var status = this.get('status');
      if(status === Ember.I18n.t('connected') ){
        return '/core/images/connected.png';
      }else if(status === Ember.I18n.t('reconnecting') ){
        return '/core/images/reconnecting.gif';
      }else{
        return '/core/images/disconnected.png';
      }
    }.property('status'),
    statusLegend: function(){
       var status = this.get('status');
      if(status === Ember.I18n.t('connected') ){
        return 'Connected - click to disconnect';
      }else if(status === Ember.I18n.t('reconnecting') ){
        return 'Reconnecting ...';
      }else{
        return 'Disconnected - click to connect';
      }
    }.property('status'),
    init: function initWeMessengerComponent(){
      this._super();
      var _this = this;
      if(window.io.socket.socket && window.io.socket.socket.connected){
        _this.setProperties({
          isConnected: true,
          status: Ember.I18n.t('connected')
        });
      }

      we.events.on('socketIoConnect',function(){
        _this.setProperties({
          isConnected: true,
          status: Ember.I18n.t('connected')
        });
      });

      we.events.on('socketIoDisconnect',function(){
        _this.setProperties({
          isConnected: false,
          status: Ember.I18n.t('disconnected')
        });
      });

      we.events.on('socketIoReconnect',function(){
        _this.setProperties({
          isConnected: true,
          status: Ember.I18n.t('connected')
        });
      });

      we.events.on('socketIoReconnecting',function(){
        _this.setProperties({
          isConnected: false,
          status: Ember.I18n.t('reconnecting')
        });
      });

    },
    actions: {
      // connect: function openList(){
      //   window.io.connect();
      // },
      // disconnect: function closeList(){
      //   window.io.disconnect();
      // },
      // toggleConnection: function closeList(){
      //   var status = this.get('status');
      //   if(status === 'connected' ){
      //     window.io.disconnect();
      //   }else if(status === 'disconnected'){
      //     window.io.connect();
      //   }
      // }
    }

  });
})(jQuery, we, Ember, App);