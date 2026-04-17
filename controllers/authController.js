const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

exports.registerUser = async (req, res) => {
  try {
    const { full_name, email, password, confirm_password, membership_category } = req.body;

    if (!full_name || !email || !password || !confirm_password) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/register');
    }

    if (password !== confirm_password) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/register');
    }

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

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
  full_name,
  email,
  password: hashedPassword,
  membership_category
};
      User.create(newUser, (err, result) => {
        if (err) {
          console.error(err);
          req.flash('error_msg', 'Registration failed');
          return res.redirect('/register');
        }

        req.flash('success_msg', 'Registration successful. Please log in.');
        res.redirect('/login');
      });
    });

  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Server error');
    res.redirect('/register');
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

    req.session.user = {
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  membership_status: user.membership_status,
  membership_category: user.membership_category,
  membership_expiry: user.membership_expiry
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