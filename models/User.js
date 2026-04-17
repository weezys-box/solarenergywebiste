const db = require('../config/db');

const User = {
  create: (userData, callback) => {
  const sql = `
    INSERT INTO users 
    (full_name, email, password, role, membership_type, membership_status, membership_category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    userData.full_name,
    userData.email,
    userData.password,
    userData.role || 'member',
    userData.membership_type || 'free',
    userData.membership_status || 'inactive',
    userData.membership_category
  ], callback);
},

  findByEmail: (email, callback) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], callback);
  },

  findById: (id, callback) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [id], callback);
  },

  // ✅ NEW: Get all users
  getAll: (callback) => {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    db.query(sql, callback);
  },

  // ✅ NEW: Update membership
  updateMembership: (id, membership, callback) => {
    const sql = 'UPDATE users SET membership_type = ? WHERE id = ?';
    db.query(sql, [membership, id], callback);
  },

  // ✅ NEW: Update role
  updateRole: (id, role, callback) => {
    const sql = 'UPDATE users SET role = ? WHERE id = ?';
    db.query(sql, [role, id], callback);
  }
};

module.exports = User;