const express = require('express');
const router = express.Router();

const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// =======================
// USER DASHBOARD
// =======================
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('user/dashboard', {
    title: 'User Dashboard'
  });
});

// =======================
// ADMIN USER MANAGEMENT
// =======================
router.get('/admin/users', ensureAdmin, userController.listUsers);

router.post('/admin/users/membership', ensureAdmin, userController.updateMembership);

router.post('/admin/users/role', ensureAdmin, userController.updateRole);

module.exports = router;