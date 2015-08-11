var async = require('async');

var hooks = {};

hooks.list = {};

hooks.on = function weAddEventListener(eventName, callback) {
  if(!hooks.list[eventName]){
    hooks.list[eventName] = [];
  }
  hooks.list[eventName].push(callback);
};

/**
 * Trigger one wejs event ( works like hooks ) and runs all functions added in this event
 * After run one [event]-after-succes or a [event]-after-error event
 *
 * @param  {string}  eventName name of the event to trigger
 * @param  {object}  data      Data to passa for event listeners
 * @param  {Function} cb   Callback
 */
hooks.trigger = function weTriggerEvent(eventName, data, cb) {
  if (!hooks.list[eventName]) return cb();

  async.eachSeries(hooks.list[eventName],
    function onHook(functionToRun, next) {
      functionToRun(data, next);
    },
    cb
  );
};

module.exports = hooks;