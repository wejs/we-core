const formaters = require('./formaters'),
      methods = require('./methods'),
      parsers = require('./parsers');

// set default response formater
formaters.default = formaters.json;

module.exports = {
  formaters: formaters,
  methods: methods,
  parsers: parsers,

  /**
   * Set  response formatters in current request
   */
  format(format, data, req, res) {
    res.format(formaters);
  },
  /**
   * Set custom responses in res variable
   */
  setCustomResponses(req, res, next) {
    for (let response in methods) {
      res[response] = methods[response].bind({req: req, res: res, next: next});
    }

    return next();
  },

  /**
   * Sort response formatters
   *
   * @param  {Object} we we.js app
   */
  sortResponses(we) {
    const formats = Object.keys(we.responses.formaters);
    we.responses.formatersUnsorted = we.responses.formaters;

    we.responses.formaters = {};

    let name;

    for (var i = 0; i < we.config.responseTypes.length; i++) {
      name = we.config.responseTypes[i];
      we.responses.formaters[name] = we.responses.formatersUnsorted[name];
    }

    formats.forEach( (f)=> {
      if (!we.responses.formaters[f]) {
        we.responses.formaters[f] =  we.responses.formatersUnsorted[f];
      }
    });
  }
};