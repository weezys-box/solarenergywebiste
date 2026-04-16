const axios = require('axios');
const db = require('../config/db');

exports.initializePayment = (req, res) => {
  const amount = 5000; // ₦5000 (you can change later)

  res.render('user/payment', {
    title: 'Upgrade Membership',
    amount,
    paystackKey: process.env.PAYSTACK_PUBLIC_KEY,
    email: req.session.user.email
  });
};

exports.verifyPayment = async (req, res) => {
  const reference = req.query.reference;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = response.data.data;

    if (data.status === 'success') {
      const userId = req.session.user.id;

      // Save payment
      const sql = `
        INSERT INTO payments (user_id, reference, amount, status, paid_at)
        VALUES (?, ?, ?, 'success', NOW())
      `;

      db.query(sql, [userId, reference, data.amount / 100], (err) => {
        if (err) console.error(err);
      });

      // Upgrade user to premium
      const updateUser = `
        UPDATE users SET membership_type = 'premium' WHERE id = ?
      `;

      db.query(updateUser, [userId]);

      // Update session
      req.session.user.membership_type = 'premium';

      req.flash('success_msg', 'Payment successful! You are now a premium member.');
      return res.redirect('/dashboard');
    } else {
      req.flash('error_msg', 'Payment failed');
      res.redirect('/dashboard');
    }

  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Payment verification failed');
    res.redirect('/dashboard');
  }
};