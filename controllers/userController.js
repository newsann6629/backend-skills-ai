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

exports.getUserResult = async (req, res) => {
    try {
        const results = await Result.findByUserId(req.user.id);
        res.json({ data: results });
    } catch (err) {
        console.error('GetUserResult error:', err);
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
    // Log incoming data for debugging
    console.log('--- saveResult Payload ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files Count:', req.files?.length || 0);
    if (req.files) req.files.forEach((f, i) => console.log(`File ${i}: ${f.fieldname}, ${f.originalname}, ${f.path}`));

    const { user_id, time_id, score, comment, file_id, token } = req.body;
    
    let authToken = req.headers.token || token;
    let evaluator_id = null;
    
    if (authToken) {
        const decoded = verifyToken(authToken);
        if (decoded) evaluator_id = decoded.id;
    }
    
    if (!evaluator_id) {
        evaluator_id = user_id;
    }

    if (!user_id || !time_id || !score) {
        console.error('Missing required fields:', { user_id, time_id, score_present: !!score });
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    try {
        const scores = Array.isArray(score) ? score : JSON.parse(score);
        const files = req.files || [];
        
        // Mapping files to section IDs
        // The frontend sends 'file_id' array matching the files array
        const fileMap = {};
        if (file_id && files.length > 0) {
            const fileIdsArray = Array.isArray(file_id) ? file_id : [file_id];
            
            fileIdsArray.forEach((fid, index) => {
                if (files[index]) {
                    fileMap[fid] = files[index].path;
                }
            });
        }

        for (let i = 0; i < scores.length; i++) {
            const s = scores[i];
            let value = s.score;
            
            if (value === 'yes') value = 1;
            else if (value === 'no') value = 0;
            else if (value === null || value === undefined) value = 0;
            else value = Number(value) || 0;

            const currentSectionId = s.section_id;
            const fileForThisSection = fileMap[currentSectionId] || null;

            await Result.create({
                user_id: user_id || null,
                evaluator_id: evaluator_id || user_id || null,
                time_id: time_id || null, 
                section_id: currentSectionId || null, 
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
