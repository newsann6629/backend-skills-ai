const pool = require('../config/db');

class User {
    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT u.*, d.department, l.level, p.position 
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN level l ON u.level_id = l.level_id
            LEFT JOIN position p ON u.position_id = p.position_id
            WHERE u.id = ?
        `, [id]);
        return rows[0];
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async create(userData) {
        const { username, email, password, czid, bdate, phone, salary, start_date, department_id, level_id, position_id } = userData;
        const [result] = await pool.execute(
            `INSERT INTO users (username, email, password, czid, bdate, phone, salary, start_date, department_id, level_id, position_id, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2')`,
            [username, email, password, czid, bdate, phone, salary, start_date, department_id, level_id, position_id]
        );
        return result.insertId;
    }

    static async update(email, updateData) {
        const { username, czid, bdate, phone, salary, department_id, level_id, position_id, password } = updateData;
        let query = 'UPDATE users SET username=?, czid=?, bdate=?, phone=?, salary=?, department_id=?, level_id=?, position_id=?';
        let params = [username, czid, bdate, phone, salary, department_id, level_id, position_id];

        if (password) {
            query += ', password=?';
            params.push(password);
        }

        query += ' WHERE email=?';
        params.push(email);

        return await pool.execute(query, params);
    }

    static async getAllUsers() {
        const [rows] = await pool.execute(`
            SELECT u.*, d.department, l.level, p.position 
            FROM users u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN level l ON u.level_id = l.level_id
            LEFT JOIN position p ON u.position_id = p.position_id
            WHERE u.role = '2'
        `);
        return rows;
    }

    static async delete(id) {
        return await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
}

module.exports = User;
