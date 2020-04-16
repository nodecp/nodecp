const { readFileSync } = require('fs');
const Core = require('./src/core');

let ConfigBuffer = readFileSync(`${__dirname}/config.yaml`, 'utf-8');
let client = new Core(ConfigBuffer);

client.init();