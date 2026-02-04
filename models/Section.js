const pool = require('../config/db');

class Section {
    static async getAll() {
        const [rows] = await pool.execute('SELECT section_id, indicator_id, section_name AS section, detail, type, require_file AS file FROM sections');
        return rows;
    }

    static async create(sectionData) {
        const { indicator_id, section, detail, type, file } = sectionData;
        return await pool.execute(
            'INSERT INTO sections (indicator_id, section_name, detail, type, require_file) VALUES (?, ?, ?, ?, ?)',
            [indicator_id, section, detail, type, file]
        );
    }
}

module.exports = Section;
