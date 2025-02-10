const mysql = require("mysql2/promise");

const mySqlPool = mysql.createPool({
  host: "193.203.184.98",
  user: "u792368195_R_CRM",
  password: "VLZ^12Sr^",
  database: "u792368195_R_CRM",
});

module.exports = mySqlPool;
