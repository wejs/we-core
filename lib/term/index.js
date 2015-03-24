var hooks = require('../hooks');

var term = {};





hooks.on('we:after:send:ok:response', function(data, done) {
  var we = data.req.getWe();

  we.log.warn('data', data.res.locals.record.get());



  return done();
});

module.exports = term;