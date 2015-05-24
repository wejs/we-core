var socketIo = require('socket.io');

var weIo = {};

/**
 * Add socket.io in http
 */
weIo.load = function load(we, server) {
  we.io = socketIo(server);

  we.events.emit('we:after:load:socket.io', { we: we, server: server } );

  // socket.io auth middleware
  we.io.use(function (socket, next) {
    if (socket.handshake && socket.handshake.query && socket.handshake.query.authToken) {
      we.auth.tokenStrategy.bind({we: we})(socket.handshake.query.authToken, function(err, user) {
        if (err) return next(err);
        if (!user) return next();

        socket.authToken = socket.handshake.query.authToken;
        socket.user = user;

        next();
      });
    } else {
      next();
    }
  });

  we.io.on('connection', function (socket) {
    we.log.verbose('a user connected:', socket.id);

    if (socket.user && socket.user.id) {
      // join user exclusive room to allow others users send
      // mesages to this user
      socket.join('user_' + socket.user.id);
    }
    // global socket to system calls
    socket.join('global');
    // Public room
    socket.join('public');

    socket.on('auth:login:token', function(data) {
      if (!data.authToken) return;
      we.log.verbose('auth:login:token', data);

      we.auth.tokenStrategy.bind({we: we})(data.authToken, function(err, user) {
        if (err) {
          return we.log.error('auth:login:token: we.auth.tokenStrategy:', err);
        }
        if (!user) return;

        socket.authToken = data.authToken;
        socket.user = user;
        socket.send('auth:authenticated', {
          user: user,
          token: socket.authToken
        });
      });
    });

    socket.on('disconnect', function() {
      we.log.verbose('user disconnected', socket.id, socket.user);
    });
  });
}

module.exports = weIo;