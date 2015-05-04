var path = require('path');

var env = require('../env');
var log = require('../log')();

/**
 * Run one grunt task as child process
 *
 * Core get from sails.js grunt feature
 *
 * @param  {String} task task name
 * @param  {Object} we   We.js object
 *
 */
module.exports = function initTaskAsSubProcess(task, we) {
  if (env == 'prod') return log.info('Grunt is disabled in prod env');

  if (!task) task = 'default';
  var ChildProcess = require('child_process');

  // Fork Grunt child process
  var child = ChildProcess.fork(

    // cwd for child process
    path.join(__dirname, 'grunt-wrapper.js'),

    // cmd args+opts for child process
    [
      task,
      '--projectPath=' + we.projectPath,
    ],

    // opts to pass to node's `child_process` logic
    {
      silent: true,
      stdio: 'pipe'
    }
  );

  var errorMsg = '';
  var stackTrace = '';

  // Log output as it comes in to the appropriate log channel
  child.stdout.on('data', function (consoleMsg) {

    // store all the output
    consoleMsg = consoleMsg.toString();
    errorMsg += consoleMsg;

    // Clean out all the whitespace
    var trimmedStackTrace = (typeof stackTrace === 'string') ? stackTrace : '';
    trimmedStackTrace = trimmedStackTrace.replace(/[\n\s]*$/,'');
    trimmedStackTrace = trimmedStackTrace.replace(/^[\n\s]*/,'');
    var trimmedConsoleMsg = (typeof consoleMsg === 'string') ? consoleMsg : '';
    trimmedConsoleMsg = trimmedConsoleMsg.replace(/[\n\s]*$/,'');
    trimmedConsoleMsg = trimmedConsoleMsg.replace(/^[\n\s]*/,'');

    // Remove '--force to continue' message since it makes no sense
    // in this context:
    trimmedConsoleMsg = trimmedConsoleMsg.replace(/Use --force to continue\./i, '');
    trimmedStackTrace = trimmedStackTrace.replace(/Use --force to continue\./i, '');

    // Find the Stack Trace related to this warning
    stackTrace = errorMsg.substring(errorMsg.lastIndexOf('Running "'));

    //     if (consoleMsg.match(/Use --force to continue/)) {
    // //   log.warn('** Grunt :: Warning **');
    // //   log.warn(errorMsg,trimmedStackTrace);
    // }

    // Handle fatal errors, like missing grunt dependency, etc.
    if (consoleMsg.match(/Fatal error/g)) {

      // If no Gruntfile exists, don't crash- just display a warning.
      if (consoleMsg.match(/Unable to find Gruntfile/i)) {
        log.info('Gruntfile could not be found.');
        log.info('(no grunt tasks will be run.)');
        return;
      }

      log.error('Grunt ::', trimmedConsoleMsg, trimmedStackTrace);
      return;
    }

    // Handle fatal Grunt errors by killing Sails process as well
    if (consoleMsg.match(/Aborted due to warnings/)) {
      log.error('** Grunt :: An error occurred. **');
      // log.warn(trimmedStackTrace);
      // sails.emit('hook:grunt:error', trimmedStackTrace);
      log.error('Grunt ::', trimmedConsoleMsg, trimmedStackTrace);
      return;
    }

    if (consoleMsg.match(/ParseError/)) {
      log.warn('** Grunt :: Parse Warning **');
      log.warn(trimmedStackTrace);
    }

    // Only display console message if it has content besides whitespace
    else if ( !consoleMsg.match(/^\s*$/) ) {
      log.silly('Grunt :: ' + trimmedConsoleMsg);
    }
  });

  // Handle general-case grunt output:
  child.stdout.on('error', function (gruntOutput) {
    log.error('Grunt ::', gruntOutput);
  });
  child.stderr.on('data', function (gruntOutput) {
    gruntOutput = _sanitize(gruntOutput);
    // Ignore the "debugger listening" message from node --debug
    if (gruntOutput.match(/debugger listening on port/)) {
      return;
    }
    log.error('Grunt ::', gruntOutput);
  });
  child.stderr.on('error', function (gruntOutput) {
    log.error('Grunt ::', _sanitize(gruntOutput));
  });

  // When process is complete, fire event on `we`
  child.on('exit', function (code, s) {

    log.info('grunt exit with:', code, s);

    // if ( code !== 0 ) return sails.emit('hook:grunt:error');
    // sails.emit('hook:grunt:done');

    // // Fire finish after grunt is done in production
    // if(sails.config.environment === 'production'){
    //   cb_afterTaskStarted();
    // }
  });

  // Since there's likely a watch task involved, and we may need
  // to flush the whole thing, we need a way to grab hold of the child process
  // So we save a reference to it
  log.silly('Tracking new grunt child process...');
  we.childProcesses.push(child);
}


/**
 * After ensuring a chunk is a string, trim any leading or
 * trailing whitespace.  If chunk cannot be nicely casted to a string,
 * pass it straight through.
 *
 * @param  {*} chunk
 * @return {*}
 */
function _sanitize (chunk) {

  if (chunk && typeof chunk === 'object' && chunk.toString) {
    chunk = chunk.toString();
  }
  if (typeof chunk === 'string') {
    chunk = chunk.replace(/^[\s\n]*/, '');
    chunk = chunk.replace(/[\s\n]*$/, '');
  }
  return chunk;
}
