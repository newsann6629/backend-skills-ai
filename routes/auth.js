const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const crypto = require('crypto');

// Manual SHA256 hash
const hashPassword = (p) => crypto.createHash('sha256').update(p).digest('hex');

// Manual JWT sign for frontend (matches jwt-decode)
const signToken = (payload) => {
    const toBase64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const header = toBase64({ alg: 'none', typ: 'JWT' });
    const data = toBase64(payload);
    return `${header}.${data}.`;
};

// POST api/auth/login
router.post('/login', async (req, res) => {
    let { email, password } = req.body;
    if (email) email = email.trim();
    if (password) password = password.trim();

    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email not found' });
        }
        const user = rows[0];
        
        // Compare SHA256 hashes
        const inputHash = hashPassword(password);
        if (inputHash !== user.password) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        const token = signToken({ id: user.id, username: user.username, role: user.role });
        res.json({ message: 'Login success', auth: token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// POST api/auth/register
router.post('/register', async (req, res) => {
    const { username, email, password, czid, date, phone, salary, start, department, level, position } = req.body;
    try {
        const hashed = hashPassword(password);
        await pool.execute(
            `INSERT INTO users (username, email, password, czid, bdate, phone, salary, start_date, department_id, level_id, position_id, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2')`,
            [username, email, hashed, czid, date, phone, salary, start, department, level, position]
        );
        res.json({ data: { message: 'Registration success' } });
    } catch (err) {
        console.error('Register error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// GET/POST api/auth/getregisdata
const getRegisData = async (req, res) => {
    try {
        const [positions] = await pool.execute('SELECT * FROM position');
        const [levels] = await pool.execute('SELECT * FROM level');
        const [departments] = await pool.execute('SELECT * FROM department');
        res.json({ data: [positions, levels, departments] });
    } catch (err) {
        console.error('GetRegisData error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
router.get('/getregisdata', getRegisData);
router.post('/getregisdata', getRegisData);

module.exports = router;
