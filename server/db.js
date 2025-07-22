const { Pool } = require('pg');

const pool = new Pool({
    user: 'notes',
    host: 'localhost',
    database: 'postgres',
    password: 'notes123',
    port: 5432
});

module.exports = pool;
