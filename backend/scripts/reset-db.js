const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

const resetDatabase = async () => {
    try {
        console.log('🔄 Starting database reset...');

        // Read schema file
        const schemaPath = path.join(__dirname, '../database/migrations/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Drop existing tables to ensure clean slate (order matters due to foreign keys)
            console.log('🗑️  Dropping existing tables...');
            await client.query(`
                DROP TABLE IF EXISTS subscription_logs CASCADE;
                DROP TABLE IF EXISTS messages CASCADE;
                DROP TABLE IF EXISTS conversations CASCADE;
                DROP TABLE IF EXISTS student_profiles CASCADE;
                DROP TABLE IF EXISTS teacher_profiles CASCADE;
                DROP TABLE IF EXISTS school_languages CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
                DROP TABLE IF EXISTS grades CASCADE;
                DROP TABLE IF EXISTS schools CASCADE;
                DROP TABLE IF EXISTS languages CASCADE;
            `);

            // Execute schema
            console.log('📝 Applying new schema...');
            await client.query(schemaSql);

            await client.query('COMMIT');
            console.log('✅ Database successfully reset and seeded!');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Database reset failed:', err);
    } finally {
        await pool.end();
    }
};

resetDatabase();
