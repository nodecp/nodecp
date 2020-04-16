const { readdirSync, statSync } = require('fs');
let EXPORTS;

EXPORTS = function(core) {
  let files = readdirSync(`${core.dir}/backend`)
  .filter(file => statSync(`${core.dir}/backend/${file}`).isFile() && file.endsWith('.js'));

  for (var file of files) {
    let backendFile = require(`${core.dir}/backend/${file}`);

    if (!backendFile.method ||
      !core.config.webserver.restana.methods.includes(backendFile.method.toLowerCase()))
      throw new Error(`Invalid backend method for file: ${file}`);

    if (core.config.allowDebugging)
      console.log(`Added ${backendFile.route} to the routes, with method [${backendFile.method.toUpperCase()}]`);

    core.http[backendFile.method.toLowerCase()](backendFile.route, (...args) => backendFile.run(...args));
  };
};

module.exports = EXPORTS;