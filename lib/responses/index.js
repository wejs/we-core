var formaters = require('./formaters');
var log = require('../log')();
var methods = require('./methods');

module.exports = {
  formaters: formaters,
  methods: methods,
  format: function formatData(format, data, req, res, we) {
    if (!formaters[format]) {
      log.warn('Unknow responseType: ', format);
      return res.status(400).res.send();
    }
    return formaters[res.locals.responseType](data, req, res, we);
  },
  /**
   * Set custom responses in res variable
   */
  setCustomResponses: function setCustomResponsesMiddleware(req, res, next) {

    for (var response in methods) {
      res[response] = methods[response].bind({req: req, res: res, next: next});
    }

    return next();
  }
};