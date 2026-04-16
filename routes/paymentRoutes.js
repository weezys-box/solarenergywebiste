const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/upgrade', ensureAuthenticated, paymentController.initializePayment);
router.get('/payment/verify', ensureAuthenticated, paymentController.verifyPayment);

module.exports = router;