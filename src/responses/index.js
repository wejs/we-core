import formaters from './formaters'
import methods from './methods'
import parsers from './parsers'

// set default response formater
formaters.default = formaters.json;

module.exports = {
  formaters: formaters,
  methods: methods,
  parsers: parsers,

  format: function formatData (format, data, req, res) {
    res.format(formaters);
  },
  /**
   * Set custom responses in res variable
   */
  setCustomResponses: function setCustomResponsesMiddleware (req, res, next) {

    for (let response in methods) {
      res[response] = methods[response].bind({req: req, res: res, next: next});
    }

    return next();
  },
  sortResponses: function sortResponses (we) {
    var formats = Object.keys(we.responses.formaters);
    we.responses.formatersUnsorted = we.responses.formaters;

    we.responses.formaters = {};

    var name;

    for (var i = 0; i < we.config.responseTypes.length; i++) {
      name = we.config.responseTypes[i]
      we.responses.formaters[name] = we.responses.formatersUnsorted[name]
    }

    formats.forEach(function(f) {
      if (!we.responses.formaters[f]) {
        we.responses.formaters[f] =  we.responses.formatersUnsorted[f]
      }
    })
  }
}