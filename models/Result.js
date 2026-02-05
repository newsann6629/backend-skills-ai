const pool = require('../config/db');

class Result {
    static async findByUserId(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM results WHERE user_id = ?',
            [userId]
        );
        return rows;
    }

    static async create(resultData) {
        const { user_id, evaluator_id, time_id, section_id, score, file_path, comment } = resultData;
        return await pool.execute(
            'INSERT INTO results (user_id, evaluator_id, time_id, section_id, score, file_path, comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, evaluator_id, time_id, section_id, score, file_path, comment]
        );
    }

    static async getSummary() {
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
        return rows;
    }
}

module.exports = Result;
