/*
HOW DOES THIS WORK?
THE SERVER DOES NOT INTERACT WITH THE MYSQL SERVER UNLESS
MODIFYING DATA. ALL DATA IS FETCHED FROM THE SERVER THEN
PLACED IN A CACHE.
*/
const Mysql = require("sync-mysql");
const ExtendedMap = require("./ExtendedMap");

module.exports = class {
  constructor(options = {}) {
    Object.defineProperties(this, {
      options: {
        value: options
      }
    });

    this.db = new Mysql(this.options);
    
    this.init();
  }

  /**
   * Initiate the wrapper.
   * Connects to the database given in the options.
   * @returns {undefined}
   */

  init() {
    this.db.query(`use ${this.options.database}`);

    return undefined;
  }

  /**
   * Fetches database data from the cache.
   * @param {String} table The table name to fetch data from
   * @param {Object} filter An object of filters, the key is the column, the value of it is the value of the column
   * @returns {Array}
   */

  fetch(table, filter = {}) {
    return this._get(table, filter);
  }

  /**
   * Checks if the table exists in the database
   * @param {String} table The table to check
   * @returns {Boolean}
   */

  checkTable(table) {
    let query = this.db.query(`SHOW TABLES LIKE '${table}'`);

    if (query.length > 0)
      return true;
    else return false;
  }

  /**
   * Inserts data to the table
   * @param {String} table The table to insert data to.
   * @param {Object} data The data to insert to the table, where the key of the object is the column, and the value is the value of the column
   * @returns {Mysql}
   */

  insert(table, data = {}) {
    if (!data)
      throw new Error("No data given!");
    else if (typeof data !== "object" || Array.isArray(data))
      throw new Error("Invalid data given");

    if (!this.checkTable(table))
      throw new Error(`Table ${table} does not exist!`);

    let ENTRIES = Object.entries(data);
    let COLUMNS = `(${ENTRIES.map(entry => entry[0]).join(', ')})`;
    let VALUES = `(${ENTRIES.map(() => '?').join(', ')})`;
    let parseData = [];

    for (let [, v] of ENTRIES) {
      parseData.push(v);
    }

    this.db.query(`INSERT INTO ${this.options.database}.${table} ${COLUMNS} VALUES ${VALUES}`, parseData);

    return this;
  }

  /**
   * Removes data from the table.
   * @param {String} table The table to remove data from.
   * @param {Object} filter The filter to use for the table, where the key of the object is the column, and the value is the value of the column
   * @returns {Boolean} Whether or not the execution has been successful or not.
   */

  remove(table, filter = {}) {
    if (!this.checkTable())
      throw new Error(`Table ${table} does not exist.`);

    let parseData = [];
    let WHERE_CLAUSE = Object.entries(filter).map(([k, v]) => {
      parseData.push(v);
      return `${k} = (?)`;
    }).join(' AND ');

    this.db.query(`DELETE FROM ${this.options.database}.${table} WHERE ${WHERE_CLAUSE}`, parseData);

    return true;
  }

  /**
   * Updates a table's row.
   * @param {String} table The table to update data from
   * @param {Array<Object>} data An array containing an object of the data that will replace the old ones.
   * @param {Object} filter A filter object, where the key would be the column, and it's value is the filter value.
   * @returns {Boolean} Whether or not the execution is successful.
   */

  update(table, data = [], filters = {}) {
    if (!this.checkTable(table))
      throw new Error(`Table ${table} doesn't exist.`);

    // This is an array of an array that contains the key of the object "filters" and it's value
    let FILTER_ENTRIES = Object.entries(filters);
  
    let SET_CLAUSE = data.map((i) => `${i.column} = (?)`).join(', ')
    let WHERE_CLAUSE = FILTER_ENTRIES.map(([k, v]) => `${k} = (?)`).join(' AND ');

    // create an empty array which would contain all escaped/parsed data for mysql
    let parseData = [];

    for (let i = 0; i < data.length; i++) {
      // push the data to the parseData array
      parseData.push(data[i].value);
    }

    for (let i = 0; i < FILTER_ENTRIES.length; i++) {
      // push the filter to the parseData array
      parseData.push(FILTER_ENTRIES[i][1]);
    }

    this.db.query(`UPDATE ${this.options.database}.${table} SET ${SET_CLAUSE} WHERE ${WHERE_CLAUSE}`, parseData);
    return true;
  }

  /**
   * Create an anonymous function that would be used as a filter for arrays.
   * @param {Object} filters 
   * @returns {Function} The function to be used as a filter.
   */

  createFilter(filters) { 
    let filtered = Object.entries(filters);

    return ((data) => filtered.every(([k, v]) => data[k] === v));
  }

  _get(table, filter = {}) {
    let parseData = [];
    let FILTERS = Object.entries(filter);
    let WHERE_CLAUSE = FILTERS.map(([k, v]) => {
      parseData.push(v);
      return `${k} = (?)`;
    }).join(' AND ');

    return this.db.query(`SELECT * FROM ${this.options.database}.${table} WHERE ${WHERE_CLAUSE}`, parseData);
  }
};