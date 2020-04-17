const { readFileSync, statSync, readdirSync } = require('fs');
const { execSync } = require('child_process');
const Core = require('./src/core');
const yaml = require('yaml');

let ConfigBuffer = readFileSync(`${__dirname}/config.yaml`, 'utf-8');
let Config = yaml.parse(ConfigBuffer);

// much better if we initiate mysql here
const Mysql = require('./src/helpers/wrappers/Mysql');
let connection = new Mysql(Config.mysql);

let client = new Core(Config, connection);

// Load the data mysql tables
let tables = readdirSync(`${__dirname}/data/tables`)
.filter(file => file.endsWith('.sql') && statSync(`${__dirname}/data/tables/${file}`).isFile());

for (let i = 0; i < tables.length; i++) {
  // check if the database has those tables
  if (connection.checkTable(tables[i].split('.sql')[0]))
    continue;

  // we can use execSync to import the data
  execSync(`mysql \
  -u ${Config.mysql.user} \
  --password=${Config.mysql.password} \
  ${Config.mysql.database} < ${__dirname}/data/tables/${tables[i]}`);
}

client.init();