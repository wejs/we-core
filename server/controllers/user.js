/**
 * UsersController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  findOneByUsername: function findOneByUsername (req, res, next) {
    var we = req.getWe();

    var username = req.params.username;
    if(!username) return next();

    res.locals.Model.find({
      where: { username: username }
    })
    .done(function found(err, user) {
      if (err) {
        we.log.error('findOneByUsername:Error in find user by username', err);
        return res.serverError(err);
      }
      if(!user) return next();
      return res.ok(user);
    });
  },

  /**
   * Create user route
   *
   * Protect this route with acl!
   */
  create: function createRecord (req, res) {
    res.locals.Model.create(req.body)
    .done(function(err, record) {
      if (err) {
        return res.serverError(err);
      }

      return res.created(record);
    });
  },

  update: function updateRecord(req, res) {
    var we = req.getWe();

    delete req.body.email;
    delete req.body.active;
    delete req.body.images;
    delete req.body.roles;

    res.locals.record.updateAttributes(req.body)
    .then(function () {
      return res.ok();
    }).catch(function(err) {
      we.log.error('Error on update user', req.body, err);
      return res.serverError();
    })
  },

  destroy: function(req, res) {
    // user account delete dont are implemented
    return res.notFound();
  }
};
