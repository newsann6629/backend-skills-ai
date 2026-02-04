const mysql = require('mysql2/promise');

const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'assessment_db'
};

async function repairDatabase() {
    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to database.');

        // 1. Check/Add evaluator_id
        const [evaluatorCols] = await connection.query('SHOW COLUMNS FROM results LIKE "evaluator_id"');
        if (evaluatorCols.length === 0) {
            console.log('➕ Adding "evaluator_id" to results table...');
            await connection.query('ALTER TABLE results ADD COLUMN evaluator_id INT AFTER user_id');
            console.log('✅ Column "evaluator_id" added.');
        }

        // 2. Check/Add comment
        const [commentCols] = await connection.query('SHOW COLUMNS FROM results LIKE "comment"');
        if (commentCols.length === 0) {
            console.log('➕ Adding "comment" to results table...');
            await connection.query('ALTER TABLE results ADD COLUMN comment TEXT');
            console.log('✅ Column "comment" added.');
        }

        // 3. Show final structure
        console.log('\n--- Final "results" table structure ---');
        const [finalResult] = await connection.query('SHOW COLUMNS FROM results');
        console.table(finalResult.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));

        await connection.end();
        console.log('🚀 Database repair complete. You can now restart the server.');
    } catch (err) {
        console.error('❌ Error repairing database:', err.message);
    }
}

repairDatabase();
