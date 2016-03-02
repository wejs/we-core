var async = require('async');
var _ = require('lodash');

/**
 * Hooks prototype
 */
var Hooks = function HooksPrototype() {
  this.list = {};
};

/**
 * Register one hook method listenner
 *
 *
 * @param  {String}   hookName
 * @param  {Function|Array} hookFunction function or array of functions to register in this hook
 * @example
 *    we.hooks.on('something', { data: '' }, function callback() {})
 */
Hooks.prototype.on = function weAddEventListener(hookName, hookFunction) {
  if (!this.list[hookName]) this.list[hookName] = [];

  if (typeof hookFunction == 'function') {
    this.list[hookName].push(hookFunction);
  } else if (_.isArray(hookFunction)) {
    //is array
    for (var i = 0; i < hookFunction.length; i++) {
      this.list[hookName].push(hookFunction[i]);
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
Hooks.prototype.trigger = function weTriggerEvent(hookName, data, cb) {
  this.log.verbose('run hook: '+ hookName);

  if (!this.list[hookName]) return cb();

  // run all functions in one hook in order
  async.eachSeries(this.list[hookName],
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
Hooks.prototype.off = function off(hookName, functionName) {
  if (!this.list[hookName]) return;

  for (var i = 0; i < this.list.length; i++) {
    if (this.list[i].name == functionName) {
      this.list[i].splice(i, 1);
      return i;
    }
  }
}

module.exports = Hooks;