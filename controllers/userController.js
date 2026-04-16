const User = require('../models/User');

exports.listUsers = (req, res) => {
  User.getAll((err, users) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Could not fetch users');
      return res.redirect('/admin/dashboard');
    }

    res.render('admin/users', {
      title: 'Manage Users',
      users
    });
  });
};

exports.updateMembership = (req, res) => {
  const { userId, membership } = req.body;

  User.updateMembership(userId, membership, (err) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Update failed');
    } else {
      req.flash('success_msg', 'Membership updated');
    }

    res.redirect('/admin/users');
  });
};

exports.updateRole = (req, res) => {
  const { userId, role } = req.body;

  User.updateRole(userId, role, (err) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Update failed');
    } else {
      req.flash('success_msg', 'Role updated');
    }

    res.redirect('/admin/users');
  });
};