/**
 * Module dependencies
 */
var actionUtil = require('we-helpers').actionUtil;

/**
 * Create Record
 *
 * post /:modelIdentity
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified criteria.  If an id was specified, just the instance with
 * that unique id will be returned.
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 * @param {*} * - other params will be used as `values` in the create
 */

module.exports = function createRecord (req, res) {

	var Model = actionUtil.parseModel(req);

	// Create data object (monolithic combination of all parameters)
	// Omit the blacklisted params (like JSONP callback param, etc.)
	var data = actionUtil.parseValues(req);

	// Create new instance of model using data from params
	Model.create(data).exec(function created (err, newInstance) {

		// Differentiate between waterline-originated validation errors
		// and serious underlying issues. Respond with badRequest if a
		// validation error is encountered, w/ validation info.
		if (err) return res.negotiate(err);

		// If we have the pubsub hook, use the model class's publish method
		// to notify all subscribers about the created item
		if (req._sails.hooks.pubsub) {
			Model.publishCreate(newInstance, !req.options.mirror && req);
		}

		// request getter used in toJSON
		function getReq() { return req; };
		// set getReq function to return current req object
		newInstance.getReq = getReq;

		var response = {};
		response[req.options.model] = newInstance;

		// Send JSONP-friendly response if it's supported
		res.created(response);
	});
};
