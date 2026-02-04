const User = require('../models/User');
const Result = require('../models/Result');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

exports.getUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAssessmentTime = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM assessment_rounds ORDER BY time_id DESC LIMIT 1');
        res.json({ data: rows }); 
    } catch (err) {
        console.error('UserTime error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAssessmentForm = async (req, res) => {
    try {
        const [indicators] = await pool.execute('SELECT * FROM indicators');
        const [sections] = await pool.execute('SELECT section_id, indicator_id, section_name AS section, detail, type, require_file AS file FROM sections');
        res.json({ data: [sections, indicators] });
    } catch (err) {
        console.error('UserForm error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.saveResult = async (req, res) => {
    const { user_id, time_id, score, comment, section_id, token } = req.body;
    
    const authToken = req.headers.token || token;
    let evaluator_id = null;
    
    if (authToken) {
        const decoded = verifyToken(authToken);
        if (decoded) evaluator_id = decoded.id;
    }
    
    if (!evaluator_id) {
        evaluator_id = user_id;
    }

    if (!user_id || !time_id || !score) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    try {
        const scores = JSON.parse(score);
        const files = req.files || [];
        
        const fileMap = {};
        if (section_id && files.length > 0) {
            const sectionIdsArray = Array.isArray(section_id) ? section_id : [section_id];
            sectionIdsArray.forEach((sid, index) => {
                if (files[index]) {
                    fileMap[sid] = files[index].path;
                }
            });
        }

        for (let i = 0; i < scores.length; i++) {
            const s = scores[i];
            let value = s.score;
            
            if (value === 'yes') value = 1;
            else if (value === 'no') value = 0;
            else value = Number(value);

            const fileForThisSection = fileMap[s.section_id] || null;

            await Result.create({
                user_id, evaluator_id, time_id, 
                section_id: s.section_id, 
                score: value, 
                file_path: fileForThisSection, 
                comment: comment || null
            });
        }
        res.json({ message: 'Result saved successfully' });
    } catch (err) {
        console.error('SaveResult error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};
