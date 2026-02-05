require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const boardRoutes = require('./routes/board');

const app = express();
const PORT = process.env.PORT || 3000;

async function initDB() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected');
        
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            const queries = schema.split(';').filter(q => q.trim() !== '');
            
            for (let query of queries) {
                try {
                    await connection.query(query);
                } catch (queryErr) {
                    if (queryErr.code !== 'ER_DUP_ENTRY') {
                        console.error('❌ Query failed:', query.substring(0, 100));
                    }
                }
            }
            console.log('✅ Database schema verified');
        }
        connection.release();
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
    }
}

initDB();

// Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, token, time');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/board', boardRoutes);

// Root level delete as requested by frontend services.js deluser()
const adminController = require('./controllers/adminController');
const { isAdmin } = require('./middleware/auth');
app.delete('/:id', isAdmin, adminController.deleteUser);

app.get('/', (req, res) => res.send('Assessment System API is running'));

// Error handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
