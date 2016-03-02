# Change log file

## Changes:

- v1.0.0: we-core now returns one prototype and mysql modules is removed from we-core
  - Update your project app.js to:
    ```js
    var We = require('we-core');
    // instantiate an new app
    var app = new We();

    app.go(function (err) {
      if (err) return console.error(err);
    });
    ```
 - If you use mysql then to install **mysql** and **express-mysql-session**:<br>
    `sh npm install --save mysql express-mysql-session `
- v0.3.97: Add suport to url alias
- v0.3.96: Add suport to windows 10