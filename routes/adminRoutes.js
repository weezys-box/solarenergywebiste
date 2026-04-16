const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middleware/adminMiddleware');

router.get('/admin/dashboard', ensureAdmin, (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard'
  });
});

module.exports = router;