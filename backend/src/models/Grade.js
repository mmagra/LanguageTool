const db = require('../config/database');

class Grade {
    // Get all grades
    static async getAll() {
        const query = `
      SELECT id, name, created_at
      FROM grades
      ORDER BY id ASC
    `;

        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching grades: ${error.message}`);
        }
    }

    // Get grade by ID
    static async findById(id) {
        const query = `
      SELECT id, name, created_at
      FROM grades
      WHERE id = $1
    `;

        try {
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error finding grade: ${error.message}`);
        }
    }

    // Create new grade
    static async create(name) {
        const query = `
      INSERT INTO grades (name)
      VALUES ($1)
      RETURNING id, name, created_at
    `;

        try {
            const result = await db.query(query, [name]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating grade: ${error.message}`);
        }
    }
}

module.exports = Grade;
