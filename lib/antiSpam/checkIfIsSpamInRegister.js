var async = require('async');

module.exports = function checkIfIsSpamInRegister(req, res, done) {
  var we = req.getWe();

  var isSpam = false;
  async.parallel([
    function checkIpOnHoneypot(cb){
      if (!we.antiSpam.honeypot) return cb(); // honeypot is disabled
      we.antiSpam.honeypot.checkRequest(req, function(err, isspam) {
        if (err) return cb(err);
        if (isspam) isSpam = true;
        return cb();
      })
    }
  ], function (err) {
    if (err) {
      return done('checkIfIsSpamInRegister: Error on check if request is spam', err);
    }

    if (isSpam) {
      we.log.warn('Auth:markedAs:isSpam:', req.ip, req.params.username, req.params.email);
      return done(req.__('auth.register.error.spam'));
    }

    // not is spam
    done();
  });
}
