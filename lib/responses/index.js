'use strict';

var _formaters = require('./formaters');

var _formaters2 = _interopRequireDefault(_formaters);

var _methods = require('./methods');

var _methods2 = _interopRequireDefault(_methods);

var _parsers = require('./parsers');

var _parsers2 = _interopRequireDefault(_parsers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// set default response formater
_formaters2.default.default = _formaters2.default.json;

module.exports = {
  formaters: _formaters2.default,
  methods: _methods2.default,
  parsers: _parsers2.default,

  format: function formatData(format, data, req, res) {
    res.format(_formaters2.default);
  },
  /**
   * Set custom responses in res variable
   */
  setCustomResponses: function setCustomResponsesMiddleware(req, res, next) {

    for (var response in _methods2.default) {
      res[response] = _methods2.default[response].bind({ req: req, res: res, next: next });
    }

    return next();
  }
};