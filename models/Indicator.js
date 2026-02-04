const pool = require('../config/db');

class Indicator {
    static async getAll() {
        const [rows] = await pool.execute('SELECT * FROM indicators');
        return rows;
    }

    static async create(indicator, weight) {
        return await pool.execute('INSERT INTO indicators (indicator, weight) VALUES (?, ?)', [indicator, weight]);
    }
}

module.exports = Indicator;
