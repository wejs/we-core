var WeMessenger = function() {
  this.connect();
};

WeMessenger.prototype.messages = {};
WeMessenger.prototype.contacts = {};

WeMessenger.prototype.connect = function () {
  window.socket = window.io({
    query: {
      authToken: this.getAuthToken()
    }
  });
};

WeMessenger.prototype.getContacts = function() {
  window.socket.emit('we:router', {
    method: 'get',
    controller: 'messenger',
    action: 'getContacts',
    token: this.getAuthToken()
  }, function (data) {
    console.log('data returned:',data); // data will be 'woot'
  });
};

WeMessenger.prototype.getAuthToken = function() {
  return App.auth.token;
};

WeMessenger.prototype.sendMessage = function(room, message) {

};

window.WeMessenger = WeMessenger;
