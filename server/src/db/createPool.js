const mysql = require("mysql2/promise");

function createPool(databaseName) {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: databaseName,
        waitForConnections: true,
        connectionLimit: 10
    };

    // Aiven requires SSL. Locally (XAMPP), we skip it.
    if (process.env.DB_SSL === "true") {
        config.ssl = { rejectUnauthorized: false };
    }

    return mysql.createPool(config);
}

module.exports = createPool;