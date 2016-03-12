# Change log file

## Changes:

- v1.0.0: we-core now returns one prototype and mysql modules is removed from we-core. For update your project do:
  - Update your global we cli and generators: `npm install we generator-wejs -g`
  - Update your project app.js to:
    ```js
    var We = require('we-core');
    // instantiate an new app
    var app = new We();

    app.go(function (err) {
      if (err) return console.error(err);
    });
    ```
  - Update your project gulpfile to:
    ```js
    var We = require('we-core');
    var we = new We();

    var projectFolder = process.cwd();
    var gulp = require('gulp');
    var weGulpTasks = require('we-gulp-tasks-default');

    weGulpTasks(we, gulp, projectFolder, function doneTask() {
      we.exit(function(){
        process.exit();
      });
    });

    ```
  - If you use mysql then to install **mysql** and **express-mysql-session**:<br>
    `npm install --save mysql express-mysql-session`
- v0.3.97: Add suport to url alias
- v0.3.96: Add suport to windows 10