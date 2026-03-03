const sql = require("mysql2/promise");
require("dotenv").config();

const pool = sql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "xyon_events_db",
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;