const bcrypt = require('bcrypt');
const User = require('../models/User');
const sendEmail = require('../utils/mailer');

exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

exports.registerUser = async (req, res) => {
  try {
    const full_name = req.body?.full_name;
    const email = req.body?.email;
    const password = req.body?.password;
    const confirm_password = req.body?.confirm_password;
    const membership_category = req.body?.membership_category;
    const profession = req.body?.profession;
    const bio = req.body?.bio;

    // multer files
    const cv_file = req.files?.cv ? req.files.cv[0].filename : null;
    const passport_photo = req.files?.passport_photo ? req.files.passport_photo[0].filename : null;

    // 🔍 Validation
    if (!full_name || !email || !password || !confirm_password) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/register');
    }

    if (password !== confirm_password) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/register');
    }

    // 🔍 Check if user exists
    User.findByEmail(email, async (err, results) => {
      if (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong');
        return res.redirect('/register');
      }

      if (results.length > 0) {
        req.flash('error_msg', 'Email already exists');
        return res.redirect('/register');
      }

      // 🔐 Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        full_name,
        email,
        password: hashedPassword,
        membership_category,
        cv_file,
        passport_photo,
        profession,
        bio,
        application_status: 'pending',
        payment_status: 'unpaid',
        membership_status: 'inactive'
      };

      // 💾 Save user
      User.create(newUser, async (err, result) => {
        if (err) {
          console.error(err);
          req.flash('error_msg', 'Registration failed');
          return res.redirect('/register');
        }

        // 📩 Send email AFTER success
        try {
          await sendEmail(
            email,
            'Application Received',
            `
              <h3>Dear ${full_name},</h3>
              <p>Your membership application has been received and is currently under review.</p>
              <p>You will be notified once a decision is made.</p>
            `
          );
        } catch (emailErr) {
          console.error('Email failed:', emailErr.message);
        }

        req.flash('success_msg', 'Registration successful. Please log in.');
        return res.redirect('/login');
      });
    });

  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Server error');
    return res.redirect('/register');
  }
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error_msg', 'All fields are required');
    return res.redirect('/login');
  }

  User.findByEmail(email, async (err, results) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Something went wrong');
      return res.redirect('/login');
    }

    if (results.length === 0) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    // ✅ Save session
    req.session.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      membership_status: user.membership_status,
      membership_category: user.membership_category,
      membership_expiry: user.membership_expiry,
      application_status: user.application_status,
      payment_status: user.payment_status
    };

    req.flash('success_msg', 'Login successful');

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/dashboard');
    }
  });
};

exports.logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.redirect('/login');
  });
};