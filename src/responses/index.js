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
  }
}