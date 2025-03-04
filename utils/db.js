// lib/db.js
import mysql from 'mysql2/promise';

let pool;

if (!pool) {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectTimeout: 10000
    });
}

export default pool;
