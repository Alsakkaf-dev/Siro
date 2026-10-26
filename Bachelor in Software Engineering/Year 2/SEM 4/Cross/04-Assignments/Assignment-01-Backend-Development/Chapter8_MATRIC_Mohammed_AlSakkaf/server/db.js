// server/db.js — MySQL connection pool (mysql2, Promise API)
const mysql = require('mysql2/promise')

// Laragon default: user "root", empty password. Change here if yours differs.
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',                  // Laragon default — never use empty password in production
  database: 'employee_directory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

module.exports = pool
