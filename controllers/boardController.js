const User = require('../models/User');
const pool = require('../config/db');

exports.getUserEvaluations = async (req, res) => {
    const { id } = req.params;
    try {
        // Find groups where this user (id) is a board member (role != 'ผู้รับการประเมิน')
        // And then find all 'ผู้รับการประเมิน' in those same groups.
        const query = `
            SELECT DISTINCT u.id, u.username, u.email, ga2.group_role
            FROM group_assignments ga1
            JOIN group_assignments ga2 ON ga1.group_id = ga2.group_id
            JOIN users u ON ga2.user_id = u.id
            WHERE ga1.user_id = ? 
              AND ga1.group_role != 'ผู้รับการประเมิน'
              AND ga2.group_role = 'ผู้รับการประเมิน'
        `;
        const [rows] = await pool.execute(query, [id]);
        res.json({ data: rows });
    } catch (err) {
        console.error('GetUserEvaluations error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
