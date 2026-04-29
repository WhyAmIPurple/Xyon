const sql = require("mysql2/promise");

const pool = sql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "xyon_user_db",
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;