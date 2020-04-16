const serveStatic = require('serve-static')
let EXPORTS;

EXPORTS = function(core) {
  core.http.use(function(req, res, next) {
    let serve = serveStatic(`${core.dir}/web/`);
    serve(req, res, next)
  });
};

module.exports = EXPORTS;