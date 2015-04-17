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

    var pk = req.params.id;

    res.locals.Model.find(pk)
    .done(function (err, user){
      if (err) {
        we.log.error('Error on find user by id.', pk, err);
        return res.serverError();
      }

      user.updateAttributes(req.body)
      .done(function(err) {
        if (err) {
          we.log.error('Error on update user', pk, req.params, err);
          return res.serverError();
        }
        return res.ok(user);
      })
    });
  },

  destroy: function(req, res) {
    // user account delete dont are implemented
    return res.notFound();
  }
};
