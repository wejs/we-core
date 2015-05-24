var socketIo = require('socket.io');
var _ = require('lodash');

var weIo = {};

/**
 * Add socket.io in http
 */
weIo.load = function load(we, server) {
  we.io = socketIo(server);

  we.events.emit('we:after:load:socket.io', { we: we, server: server } );

  we.io.onlineusers = {};

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
      we.io.removeFromOnlineUsers(socket);
    });
  });

  we.io.removeFromOnlineUsers = function removeFromOnlineUsers(socket) {
    if (typeof we.io.onlineusers[socket.user.id] === 'undefined') return;
    if (typeof we.io.onlineusers[socket.user.id] === 'undefined') return;
    if (!socket.user || !socket.user.id) return;

    if (we.io.onlineusers[socket.user.id]) {
      var index = we.io.onlineusers[socket.user.id].sockets.indexOf(socket.id);
      if (index >-1 ) we.io.onlineusers[socket.user.id].sockets.splice(index, 1);

      if (!we.io.onlineusers[socket.user.id].sockets.length)
        delete we.io.onlineusers[socket.user.id];
    }

    if (!we.io.isOnline(socket.user.id) ) {
      we.db.models.contact.findUserContacts(socket.user.id)
      .then(function (contacts) {
        contacts.forEach(function(c) {
          var cId = c.to;
          if (c.to == socket.user.id) cId = c.from;
          we.io.sockets.to('user_' + cId).emit('contact:disconnect', { id: socket.user.id });
        })
      });
    }
  }

  we.io.isOnline = function isOnline(userId) {
    if (_.isEmpty(we.io.onlineusers[userId])) {
      return false;
    } else {
      return true;
    }
  }
}

module.exports = weIo;