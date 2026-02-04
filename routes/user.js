const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Manual JWT verify
const verifyToken = (token) => {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        return payload;
    } catch (e) {
        console.error('Token verification error:', e);
        return null;
    }
};

// Middleware to check user/admin role
const isAuth = (req, res, next) => {
    const token = req.headers.token || req.body.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid token' });
    
    req.user = decoded;
    next();
};

// GET api/user/data
router.get('/data', isAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT u.*, d.department, l.level, p.position 
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN level l ON u.level_id = l.level_id
            LEFT JOIN position p ON u.position_id = p.position_id
            WHERE u.id = ?
        `, [req.user.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET api/user/time
router.get('/time', isAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM assessment_rounds ORDER BY time_id DESC LIMIT 1');
        // Frontend expects an array for length check: if(res.length >= 1)
        res.json({ data: rows }); 
    } catch (err) {
        console.error('UserTime error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET api/user/form
router.get('/form', isAuth, async (req, res) => {
    try {
        // Fetch indicators and their sections with aliased names for frontend
        const [indicators] = await pool.execute('SELECT * FROM indicators');
        const [sections] = await pool.execute('SELECT section_id, indicator_id, section_name AS section, detail, type, require_file AS file FROM sections');
        
        // Frontend mapdata(res[0], res[1]) expects [sections, indicators]
        res.json({ data: [sections, indicators] });
    } catch (err) {
        console.error('UserForm error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST api/user/result
router.post('/result', isAuth, upload.array('file'), async (req, res) => {
    // The frontend sends user_id, time_id, score (JSON string), and files
    // Note: score is JSON.stringify(data.value) where data.value is an array of section objects
    const { user_id, time_id, score, comment } = req.body;
    const evaluator_id = req.user.id;
    
    try {
        const scores = JSON.parse(score);
        const files = req.files || [];

        for (let i = 0; i < scores.length; i++) {
            const s = scores[i];
            const fileForThisSection = files[i] ? files[i].path : null;

            await pool.execute(
                'INSERT INTO results (user_id, evaluator_id, time_id, section_id, score, file_path, comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user_id, evaluator_id, time_id, s.section_id, s.score, fileForThisSection, comment || null]
            );
        }
        res.json({ message: 'Result saved successfully' });
    } catch (err) {
        console.error('SaveResult error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
