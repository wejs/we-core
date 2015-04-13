var events = require('../events');

var messenger = {};


events.on('we:after:load:socket.io', function(data) {
  data.we.io.on('connection', function(socket) {



  });
});




module.exports = messenger;