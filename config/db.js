const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: global.config.DB_HOST,
    user: global.config.DB_USER,
    password: global.config.DB_PASSWORD,
    database: global.config.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
