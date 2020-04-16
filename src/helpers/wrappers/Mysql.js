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
      cache: {
        value: new ExtendedMap()
      },

      options: {
        value: options
      },

      defaultTableValues: {
        value: new ExtendedMap()
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
    let tables = this.db.query("show tables");

    // iterate the tables
    for (let i = 0; i < tables.length; i++) {
      let table = tables[i][`Tables_in_${this.options.database}`]
      let query;

      // get all default values & the structure then add it to the cache
      this.defaultTableValues.set(table, this.db.query(`describe ${this.options.database}.${table}`));

      // get all values of the table
      query = this.db.query(`SELECT * FROM ${this.options.database}.${table}`);

      // add the data to the cache
      this.cache.set(table, query);
    }

    return undefined;
  }

  /**
   * Fetches database data from the cache.
   * @param {String} table The table name to fetch data from
   * @param {Function} filter The function to be used when filtering the array that was returned from the cache.
   * @returns {Array}
   */

  fetch(table, filter) {
    return this.cache.get(table).filter(filter);
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

    if (!this.cache.has(table))
      throw new Error(`Table ${table} does not exist.`);

    let _data = this.cache.ensure(table, []);
    let ENTRIES = Object.entries(data);
    let defaultData = this.defaultTableValues.get(table);

    let COLUMNS = `(${ENTRIES.map(entry => entry[0]).join(', ')})`;
    let VALUES = `(${ENTRIES.map(() => '?').join(', ')})`;

    let parseData = [];

    for (let [, v] of ENTRIES) {
      parseData.push(v);
    }

    for (let i = 0; i < defaultData.length; i++) {
      if (!(defaultData[i].Field in data))
        data[defaultData[i].Field] = !(isNaN(defaultData[i].Default)) ?
        parseInt(defaultData[i].Default) :
        defaultData[i].Default;
    }

    _data.push(data);
    this.cache.set(table, _data);

    this.db.query(`INSERT INTO ${this.options.database}.${table} ${COLUMNS} VALUES ${VALUES}`, parseData);

    return this;
  }

  /**
   * Removes data from the table.
   * @param {String} table The table to remove data from.
   * @param {Object} filter The filter to use for the table, where the key of the object is the column, and the value is the value of the column
   * @returns {Boolean} Whether or not the execution has been successful or not.
   */

  remove(table, filter) {
    const _table = this.cache.get(table);
    
    if (!_table)
      throw new Error(`Table ${table} doesn't exist.`);

    let tableData = _table.filter(this.createFilter(filter));
    if (tableData.length < 1)
      return false;

    // iterate through filtered data
    for (let i = 0; i < tableData.length; i++) {
      // iterate through the data to be applied.
      let tableIndex = _table.indexOf(tableData[i]);

      // remove the value from the array
      if (tableIndex > -1) {
        _table.splice(tableIndex, 1);
      }
    }

    // add it to cache
    this.cache.set(table, _table);

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

  update(table, data = [], filters) {
    const _table = this.cache.get(table);

    if (!_table)
      throw new Error(`Table ${table} doesn't exist.`);

    let tableData = _table.filter(this.createFilter(filters));
    if (tableData.length < 1)
      return false;

    // iterate through filtered data
    for (let i = 0; i < tableData.length; i++) {
      // iterate through the data to be applied.
      let tableIndex = _table.indexOf(tableData[i]);

      for (let x = 0; x < data.length; x++) {
        tableData[i][data[x].column] = data[x].value;
      }

      // once the changes are applied, add them to cache.
      _table[tableIndex] = tableData[i];
    }

    // update the cache
    this.cache.set(table, _table);

    /*
      EVERYTHING AFTER THIS IS ABOUT UPDATING IT IN THE DATABASE ITSELF.
      WE CAN'T JUST LEAVE THE DATABASE UNCHANGED
    */

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
};