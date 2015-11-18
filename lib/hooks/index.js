var async = require('async');
var _ = require('lodash');

var log = require('../log')();

var hooks = {};

hooks.list = {};

/**
 * Register one hook method listenner
 *
 *
 * @param  {String}   hookName
 * @param  {Function|Array} hookFunction function or array of functions to register in this hook
 * @example
 *    we.hooks.on('something', { data: '' }, function callback() {})
 */
hooks.on = function weAddEventListener(hookName, hookFunction) {
  if(!hooks.list[hookName]){
    hooks.list[hookName] = [];
  }

  if (typeof hookFunction == 'function') {
    hooks.list[hookName].push(hookFunction);
  } else if(_.isArray(hookFunction)){
    //is array
    for (var i = 0; i < hookFunction.length; i++) {
      hooks.list[hookName].push(hookFunction[i]);
    }
  } else {
    throw new Error('invalid hookFunction in hooks.on');
  }
};

/**
 * Trigger one wejs event ( works like hooks ) and runs all functions added in this event
 * After run one [event]-after-succes or a [event]-after-error event
 *
 * @param  {string}  hookName name of the event to trigger
 * @param  {object}  data      Data to passa for event listeners
 * @param  {Function} cb   Callback
 */
hooks.trigger = function weTriggerEvent(hookName, data, cb) {
  log.verbose('run hook: '+ hookName);

  if (!hooks.list[hookName]) return cb();

  // run all functions in one hook in order
  async.eachSeries(hooks.list[hookName],
    function onHook(functionToRun, next) {
      functionToRun(data, next);
    },
    cb
  );
};

/**
 * Remove one hookFunction by name from hook
 *
 * @param  {String} hookName
 * @param  {String} functionName
 * @return {null|Number} Null or the old hookFunction index
 */
hooks.off = function off(hookName, functionName) {
  if (!hooks.list[hookName]) return;

  for (var i = 0; i < hooks.list.length; i++) {
    if (hooks.list[i].name == functionName) {
      hooks.list[i].splice(i, 1);
      return i;
    }
  }
}

module.exports = hooks;