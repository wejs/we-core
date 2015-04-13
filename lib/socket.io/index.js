var socketIo = require('socket.io');
var router = require('../router.js');
var messenger = require('../messenger');

var weIo = {};

/**
 * Add socket.io in http
 */
weIo.load = function load(we, server) {
  we.io = socketIo(server);


  we.events.emit('we:after:load:socket.io', { we: we, server: server } );

  we.io.use(function(socket, next) {
    we.log.warn('>>>', socket.handshake.query, socket.authToken);

    if (socket.handshake && socket.handshake.query && socket.handshake.query.authToken) {
      socket.authToken = socket.handshake.query.authToken;
    }
    next();
  });

  we.io.on('connection', function (socket) {
    we.log.info('a user connected', socket.id);

    socket.on('login:with:token', function(data){
      console.log('login:with:token', data);

      socket.authToken = data.token;
    });

    socket.on('disconnect', function(){
      console.log('user disconnected', socket.id);
    });

  });
}

module.exports = weIo;