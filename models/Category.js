const db = require('../config/db');

const Category = {
  getAll: (callback) => {
    const sql = 'SELECT * FROM categories ORDER BY name ASC';
    db.query(sql, callback);
  }
};

module.exports = Category;