const express = require('express');
const path = require('path');

// Manual config
const config = {
    DB_HOST: 'localhost',
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_NAME: 'assessment_db',
    JWT_SECRET: 'your_jwt_secret_key_here'
};
global.config = config;

const pool = require('./config/db');
const fs = require('fs');

async function initDB() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected');
        
        // Read schema.sql
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        const queries = schema.split(';').filter(q => q.trim() !== '');
        
        for (let query of queries) {
            try {
                // console.log('Executing:', query.substring(0, 50));
                await connection.query(query);
            } catch (queryErr) {
                // Ignore duplicate entry errors for seed data but log them as warnings
                if (queryErr.code === 'ER_DUP_ENTRY') {
                    console.log(`ℹ️ Skipping duplicate entry for: ${query.substring(0, 50)}...`);
                } else {
                    console.error('❌ Query failed:', query);
                    throw queryErr;
                }
            }
        }
        
        console.log('✅ Database schema initialized/verified');
        connection.release();
    } catch (err) {
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.log('⚠️ Database "assessment_db" missing. Attempting to create...');
            try {
                const mysql = require('mysql2/promise');
                const tempConn = await mysql.createConnection({
                    host: config.DB_HOST,
                    user: config.DB_USER,
                    password: config.DB_PASSWORD
                });
                await tempConn.query(`CREATE DATABASE IF NOT EXISTS ${config.DB_NAME}`);
                await tempConn.end();
                console.log('✅ Database created. Restarting initialization...');
                return initDB();
            } catch (createErr) {
                console.error('❌ Failed to create database:', createErr.message);
            }
        } else {
            console.error('❌ Database initialization failed:', err.message);
        }
    }
}

initDB();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();
const PORT = 3000;

// Manual CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, token, time, Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Assessment System API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
