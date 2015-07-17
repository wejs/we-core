/**
 * Log out current user
 *
 * @param  {object}   request
 * @param  {object}   response
 * @param  {Function} cb
 */
module.exports = function logOut(req, res, cb) {
  req.logout();
  cb();
}