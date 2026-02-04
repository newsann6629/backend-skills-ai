const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const hashPassword = (p) => crypto.createHash('sha256').update(p).digest('hex');

const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key_here', { expiresIn: '24h' });
};

exports.login = async (req, res) => {
    let { email, password } = req.body;
    if (email) email = email.trim();
    if (password) password = password.trim();

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Email not found' });
        }
        
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
};

exports.register = async (req, res) => {
    const { username, email, password, czid, bdate, phone, sal, start, dep, level, po } = req.body;
    try {
        const hashed = hashPassword(password);
        await User.create({
            username, email, password: hashed, czid, bdate, phone, 
            salary: sal, start_date: start, department_id: dep, 
            level_id: level, position_id: po
        });
        res.json({ data: { message: 'Registration success' } });
    } catch (err) {
        console.error('Register error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRegisData = async (req, res) => {
    try {
        const pool = require('../config/db');
        const [positions] = await pool.execute('SELECT * FROM position');
        const [levels] = await pool.execute('SELECT * FROM level');
        const [departments] = await pool.execute('SELECT * FROM department');
        res.json({ data: [positions, levels, departments] });
    } catch (err) {
        console.error('GetRegisData error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
