const db = require('../config/db');

const Journal = {
  create: (journalData, callback) => {
    const sql = `
      INSERT INTO journals 
      (title, abstract, author, category_id, year, keywords, file_path, access_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      journalData.title,
      journalData.abstract,
      journalData.author,
      journalData.category_id,
      journalData.year,
      journalData.keywords,
      journalData.file_path,
      journalData.access_type,
      journalData.uploaded_by
    ], callback);
  },

  getAll: (callback) => {
    const sql = `
      SELECT journals.*, categories.name AS category_name
      FROM journals
      LEFT JOIN categories ON journals.category_id = categories.id
      ORDER BY journals.created_at DESC
    `;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT journals.*, categories.name AS category_name
      FROM journals
      LEFT JOIN categories ON journals.category_id = categories.id
      WHERE journals.id = ?
    `;
    db.query(sql, [id], callback);
  }
};

module.exports = Journal;