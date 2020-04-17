const bodyParser = require("body-parser");
let EXPORTS;

EXPORTS = function(core) {
  core.http.use(bodyParser.json());
  core.http.use(bodyParser.urlencoded({ extended: true }));
}

module.exports = EXPORTS;
