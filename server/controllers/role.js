/**
 * RolesController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {

  create: function (req, res) {
    console.log('@todo role create');
    next();
  },

  // update: function (req, res, next) {
  //   console.log('@todo role update');
  //   next();
  // },

  delete: function (req, res, next) {
    console.log('@todo role delete');
    next();
  },

  add: function (req, res, next) {
    console.log('@todo role add');
    next();
  },

  remove: function (req, res, next) {
    console.log('@todo role remove');
    next();
  },


  /**
   * Find Records
   *
   *  get   /:modelIdentity
   *   *    /:modelIdentity/find
   *
   * An API call to find and return model instances from the data adapter
   * using the specified criteria.  If an id was specified, just the instance
   * with that unique id will be returned.
   *
   * Optional:
   * @param {Object} where       - the find criteria (passed directly to the ORM)
   * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
   * @param {Integer} skip       - the number of records to skip (useful for pagination)
   * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
   * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
   */
  find: function findRecords (req, res) {
    // Look up the model
    var Model = req._sails.models.role;
    // Lookup for records that match the specified criteria
    var query = Model.find()
    .where( actionUtil.parseCriteria(req) )
    .limit( 2000 )
    .skip( actionUtil.parseSkip(req) )
    .sort( actionUtil.parseSort(req) );
    query.exec(function found(err, matchingRecords) {
      if (err) return res.serverError(err);

      res.ok(matchingRecords);
    });
  }
};
