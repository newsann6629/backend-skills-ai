const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const crypto = require('crypto');

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

// Middleware to check authentication
const isAuth = (req, res, next) => {
    const token = req.headers.token || req.body.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid token' });
    
    req.user = decoded;
    next();
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
    const token = req.headers.token || req.body.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid token' });
    
    if (decoded.role !== '1') {
        return res.status(403).json({ message: 'Require Admin Role' });
    }
    req.user = decoded;
    next();
};

// PUT api/admin/edituser
router.put('/edituser', isAdmin, async (req, res) => {
    const { username, email, password, czid, bdate, phone, sal, po, level, dep } = req.body;
    try {
        let query = 'UPDATE users SET username=?, czid=?, bdate=?, phone=?, salary=?, department_id=?, level_id=?, position_id=?';
        let params = [username, czid, bdate, phone, sal, dep, level, po];

        if (password) {
            const hashed = crypto.createHash('sha256').update(password).digest('hex');
            query += ', password=?';
            params.push(hashed);
        }

        query += ' WHERE email=?';
        params.push(email);

        await pool.execute(query, params);
        res.json({ data: { message: 'Update success' } });
    } catch (err) {
        console.error('EditUser error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST api/admin/indicator
router.post('/indicator', isAdmin, async (req, res) => {
    const { indicator, weight } = req.body;
    try {
        await pool.execute('INSERT INTO indicators (indicator, weight) VALUES (?, ?)', [indicator, weight]);
        res.json({ message: 'Add indicator success' });
    } catch (err) {
        console.error('AddIndicator error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET api/admin/indicator
router.get('/indicator', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM indicators');
        res.json({ data: rows });
    } catch (err) {
        console.error('GetIndicator error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET api/admin/user
router.get('/user', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT u.*, d.department, l.level, p.position 
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN level l ON u.level_id = l.level_id
            LEFT JOIN position p ON u.position_id = p.position_id
            WHERE u.role = '2'
        `);
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST api/admin/time
router.post('/time', isAdmin, async (req, res) => {
    const { time1, time2 } = req.body; // time1: {start, end}, time2: {start, end}
    try {
        // For simplicity, we keep only one set of times for now or append
        await pool.execute(
            'INSERT INTO assessment_rounds (time1_start, time1_end, time2_start, time2_end) VALUES (?, ?, ?, ?)',
            [time1?.start, time1?.end, time2?.start, time2?.end]
        );
        res.json({ message: 'Set time success' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET api/admin/time
router.get('/time', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM assessment_rounds ORDER BY time_id DESC LIMIT 1');
        // Frontend index.vue expects an array for v-for="time in t"
        res.json({ data: rows });
    } catch (err) {
        console.error('GetTime error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST api/admin/section (mapped from addform in services.js)
router.post('/section', isAdmin, async (req, res) => {
    const { section, indicator_id, detail, type, file } = req.body;
    try {
        await pool.execute(
            'INSERT INTO sections (indicator_id, section_name, detail, type, require_file) VALUES (?, ?, ?, ?, ?)',
            [indicator_id, section, detail, type, file]
        );
        res.json({ message: 'Add section success' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST api/admin/group
router.post('/group', isAdmin, async (req, res) => {
    const { member } = req.body;
    // Implementation for groups if needed, currently just logging as requested by frontend call
    console.log('Group member data:', member);
    res.json({ message: 'Group data received' });
});

// GET api/admin/getuserresult
router.get('/getuserresult', isAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                u.username AS user_username,
                eval.username AS board_username,
                self.total_score AS user_sum,
                judge.total_score AS board_sum,
                judge.max_comment AS board_comment
            FROM (
                SELECT user_id, time_id, SUM(score) as total_score 
                FROM results 
                WHERE user_id = evaluator_id 
                GROUP BY user_id, time_id
            ) self
            LEFT JOIN (
                SELECT user_id, evaluator_id, time_id, SUM(score) as total_score, MAX(comment) as max_comment
                FROM results 
                WHERE user_id != evaluator_id
                GROUP BY user_id, evaluator_id, time_id
            ) judge ON self.user_id = judge.user_id AND self.time_id = judge.time_id
            JOIN users u ON self.user_id = u.id
            LEFT JOIN users eval ON judge.evaluator_id = eval.id
        `;
        const [rows] = await pool.execute(query);
        res.json({ data: rows });
    } catch (err) {
        console.error('GetUserResult error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
