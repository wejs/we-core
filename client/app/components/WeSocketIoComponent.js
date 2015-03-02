
App.WeSocketIoComponent = Ember.Component.extend({
  tagName: 'div',
  classNameBindings: ['msgClass'],

  // socket.io to use in this component
  socket: null,
  // reconnecting flag
  isReconecting: false,
  // flag to check if is connected
  isConnected: false,

  tryCount: 1,
  timeToReconnect: 0,

  timeToReconnectInSeconds: function() {
    return this.get('timeToReconnect') / 1000;
  }.property('timeToReconnect'),

  // is disconnected and dont are trying to reconnect
  isDisconnected: function(){
    if ( this.get('isConnected') ) {
      return false;
    }
    return true;
  }.property('isConnected'),

  isConnectedMsg: 'Connected',

  isReconnectingMsg: 'Não há conexão.',

  disconectedMsg: 'Desconectado do servidor. ',
  ClickToConnectText: 'Clique aqui para tentar conectar agora',

  msgClass: function() {
    // connected
    if (this.get('isConnected')) {
      // sr-only makes connectd invisible in twitter bootstrap themes
      return 'alert alert-success text-center sr-only';
    }

    // reconnecting
    if ( this.get('isReconecting') ) {
      return 'alert alert-warning text-center';
    }

    return 'alert alert-danger text-center';
  }.property('isReconecting', 'isConnected'),

  msgText: function(){
    // connected
    if (this.get('isConnected')) {
      return this.get('isConnectedMsg');
    }

    // reconnecting
    if ( this.get('isReconecting') ) {
      return this.get('isReconnectingMsg');
    }

    return this.get('disconectedMsg');

  }.property('isReconecting', 'isConnected'),

  init: function() {
    this._super();
    var self = this;
    var socket = this.get('socket');

    // if dont have set a socket.io then get it from global
    if (!socket) {
      if( !window.io.socket ) {
        return Ember.Logger.error('Socket.io not found');
      }
      self.set('socket', window.io.socket);
      // set local socket var
      socket = self.get('socket');
    }

    if( socket.socket && socket.socket.connected ) {
      self.set('isConnected', true);
    }

    socket.on('connect', function () {
      self.set('isConnected', true);
      self.set('isReconecting', false);
    });

    socket.on('disconnect', function () {
      self.set('isConnected', false);
      self.set('isReconecting', false);
    });

    socket.on('connecting', function () {
      console.warn('connecting');
    });

    socket.on('connect_failed', function () {
      self.set('isConnected', false);
    });

    socket.on('reconnect_failed', function () {
      self.set('isConnected', false);
      self.set('isReconecting', false);
    });

    socket.on('close', function () {
      console.warn('close');
    });

    socket.on('reconnect', function () {
      console.warn('reconnect');
    });

    socket.on('reconnecting', function (time, tryCount) {
     self.set('timeToReconnect', time);
     self.set('tryCount', tryCount);
     self.set('isReconecting', true);
    });
  },

  actions: {
    connect: function() {
      this.get('socket').socket.connect();
    },

    // opcional disconnect action
    disconnect: function() {
      this.get('socket').disconnect();
    }
  }
});