const User = require('../models/User');
const pool = require('../config/db');
const Indicator = require('../models/Indicator');
const Section = require('../models/Section');
const Result = require('../models/Result');
const crypto = require('crypto');

exports.editUser = async (req, res) => {
    const { username, email, password, czid, bdate, phone, sal, po, level, dep } = req.body;
    try {
        let hashedPass = null;
        if (password) {
            hashedPass = crypto.createHash('sha256').update(password).digest('hex');
        }

        await User.update(email, {
            username, czid, bdate, phone, 
            salary: sal, department_id: dep, 
            level_id: level, position_id: po, 
            password: hashedPass
        });
        res.json({ data: { message: 'Update success' } });
    } catch (err) {
        console.error('EditUser error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addIndicator = async (req, res) => {
    const { indicator, weight } = req.body;
    try {
        await Indicator.create(indicator, weight);
        res.json({ message: 'Add indicator success' });
    } catch (err) {
        console.error('AddIndicator error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getIndicators = async (req, res) => {
    try {
        const rows = await Indicator.getAll();
        res.json({ data: rows });
    } catch (err) {
        console.error('GetIndicator error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const rows = await User.getAllUsers();
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addRound = async (req, res) => {
    const { time1, time2 } = req.body;
    try {
        await pool.execute(
            'INSERT INTO assessment_rounds (time1_start, time1_end, time2_start, time2_end) VALUES (?, ?, ?, ?)',
            [time1?.start, time1?.end, time2?.start, time2?.end]
        );
        res.json({ message: 'Set time success' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRound = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM assessment_rounds ORDER BY time_id DESC LIMIT 1');
        res.json({ data: rows });
    } catch (err) {
        console.error('GetTime error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addSection = async (req, res) => {
    const { section, indicator_id, detail, type, file } = req.body;
    try {
        await Section.create({ indicator_id, section, detail, type, file });
        res.json({ message: 'Add section success' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.receiveGroup = async (req, res) => {
    const { member } = req.body;
    try {
        const [result] = await pool.execute('INSERT INTO assessment_groups () VALUES ()');
        const groupId = result.insertId;

        for (const m of member) {
            await pool.execute(
                'INSERT INTO group_assignments (group_id, user_id, group_role) VALUES (?, ?, ?)',
                [groupId, m.user_id, m.role]
            );
        }
        res.json({ message: 'Group created successfully', group_id: groupId });
    } catch (err) {
        console.error('AddGroup error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const [groups] = await pool.execute('SELECT group_id FROM assessment_groups ORDER BY created_at DESC');
        const [members] = await pool.execute(`
            SELECT ga.*, u.username 
            FROM group_assignments ga
            JOIN users u ON ga.user_id = u.id
        `);
        // Group.vue expect [groups, members]
        res.json({ data: [groups, members] });
    } catch (err) {
        console.error('GetGroups error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteGroup = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM assessment_groups WHERE group_id = ?', [id]);
        res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        console.error('DeleteGroup error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserResults = async (req, res) => {
    try {
        const summary = await Result.getSummary();
        res.json({ data: summary });
    } catch (err) {
        console.error('GetUserResult error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await User.delete(id);
        res.json({ message: 'Delete success' });
    } catch (err) {
        console.error('DeleteUser error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
