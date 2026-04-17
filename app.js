const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const axios = require('axios');
require('dotenv').config();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const db = require('./config/db');
const { ensureAdmin } = require('./middleware/authMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const journalRoutes = require('./routes/journalRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();


// =======================
// MIDDLEWARE
// =======================

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static('public'));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user || null;
  next();
});

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user || null;
  res.locals.title = 'Membership Site'; // 👈 default
  next();
});

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');


// =======================
// MULTER CONFIG
// =======================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });


// =======================
// ROUTES
// =======================

// HOME (dynamic news preview)
app.get('/', (req, res) => {
  db.query('SELECT * FROM news ORDER BY created_at DESC LIMIT 3', (err, results) => {
    if (err) throw err;

    res.render('pages/home', {
      title: 'Home',
      news: results
    });
  });
});

// Static pages
app.get('/about', (req, res) => {
  res.render('pages/about', { title: 'About' });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', { title: 'Contact' });
});

app.get('/membership', (req, res) => {
  res.render('pages/membership', { title: 'Membership' });
});


// =======================
// NEWS ROUTES
// =======================

// All news
app.get('/news-events', (req, res) => {
  db.query('SELECT * FROM news ORDER BY created_at DESC', (err, results) => {
    if (err) throw err;

    res.render('pages/news-events', {
      title: 'News & Events',
      news: results
    });
  });
});

// Single news
app.get('/news-events/:id', (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM news WHERE id = ?', [id], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.send('News not found');
    }

    res.render('pages/news-detail', {
      title: results[0].title,
      item: results[0]
    });
  });
});


// =======================
// ADMIN NEWS
// =======================
// =======================
// ADMIN NEWS
// =======================

// Show form
app.get('/admin/news', ensureAdmin, (req, res) => {
  res.render('admin/news', {
    title: 'Add News'
  });
});

// Create news (WITH IMAGE UPLOAD)
app.post('/admin/news', ensureAdmin, upload.single('image'), (req, res) => {
  const { title, content } = req.body;

  const image = req.file
    ? '/uploads/' + req.file.filename
    : null;

  const sql = `
    INSERT INTO news (title, content, image)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [title, content, image], (err) => {
    if (err) throw err;

    req.flash('success_msg', 'News created successfully');
    res.redirect('/news-events');
  });
});

// Edit page
app.get('/admin/news/edit/:id', ensureAdmin, (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM news WHERE id = ?', [id], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.redirect('/news-events');
    }

    res.render('admin/edit-news', {
      title: 'Edit News',
      item: results[0]
    });
  });
});

// Update news
app.post('/admin/news/edit/:id', ensureAdmin, upload.single('image'), (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body;

  let sql;
  let values;

  if (req.file) {
    const image = '/uploads/' + req.file.filename;

    sql = `
      UPDATE news 
      SET title = ?, content = ?, image = ?
      WHERE id = ?
    `;
    values = [title, content, image, id];
  } else {
    sql = `
      UPDATE news 
      SET title = ?, content = ?
      WHERE id = ?
    `;
    values = [title, content, id];
  }

  db.query(sql, values, (err) => {
    if (err) throw err;

    req.flash('success_msg', 'News updated successfully');
    res.redirect('/news-events');
  });
});

// Delete news
app.post('/admin/news/delete/:id', ensureAdmin, (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM news WHERE id = ?', [id], (err) => {
    if (err) throw err;

    req.flash('success_msg', 'News deleted successfully');
    res.redirect('/news-events');
  });
});

app.get('/membership/pay', (req, res) => {
  res.render('pages/payment', {
    title: 'Pay Membership Dues'
  });
});

app.post('/membership/pay', async (req, res) => {

  const user = req.session.user;

  const pricing = {
    Fellow: 20000,
    Full: 15000,
    Associate: 10000,
    Student: 5000,
    Corporate: 50000
  };

  const amount = pricing[user.membership_category] * 100;

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount,
        callback_url: 'http://localhost:3000/membership/verify'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    res.redirect(response.data.data.authorization_url);

  }catch (error) {
  console.error('PAYSTACK ERROR:', error.response?.data || error.message);
  res.send('Payment failed: ' + JSON.stringify(error.response?.data || error.message));
}
});

app.get('/membership/verify', async (req, res) => {

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

    if (response.data.data.status === 'success') {

      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      db.query(
        'UPDATE users SET membership_status = "active", membership_expiry = ? WHERE id = ?',
        [expiry, req.session.user.id],
        (err) => {

          if (err) throw err;

          // update session
          req.session.user.membership_status = 'active';
          req.session.user.membership_expiry = expiry;

          req.flash('success_msg', 'Membership payment successful!');
          res.redirect('/dashboard');
        }
      );

    } else {
      res.send('Payment not successful');
    }

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send('Verification failed');
  }
});

app.get('/agc', (req, res) => {
  res.render('pages/agc', {
    title: 'AGC Registration'
  });
});

app.post('/agc/register', (req, res) => {
  const { full_name, email, category } = req.body;

  // 🔍 CHECK FOR EXISTING PENDING REGISTRATION
  db.query(
    'SELECT * FROM registrations WHERE email = ? AND payment_status = "pending"',
    [email],
    (err, results) => {

      if (err) {
        console.error(err);
        return res.send('Database error');
      }

    //   if (results.length > 0) {
    //     req.flash('error_msg', 'You already have a pending registration');
    //     return res.redirect('/agc');
    //   }

      // ✅ IF NO DUPLICATE → INSERT NEW
      const sql = `
        INSERT INTO registrations (full_name, email, category)
        VALUES (?, ?, ?)
      `;

      db.query(sql, [full_name, email, category], (err, result) => {
        if (err) {
          console.error(err);
          return res.send('Insert error');
        }

        // SAVE FOR PAYMENT STEP
        req.session.registrationId = result.insertId;
        req.session.agcEmail = email;

        res.redirect('/agc/payment');
      });
    }
  );
});

app.get('/admin/registrations', ensureAdmin, (req, res) => {
  db.query('SELECT * FROM registrations ORDER BY created_at DESC', (err, results) => {
    if (err) throw err;

    res.render('admin/registrations', {
      title: 'AGC Registrations',
      registrations: results
    });
  });
});

app.get('/agc/payment', (req, res) => {

  const registrationId = req.session.registrationId;

  db.query(
    'SELECT * FROM registrations WHERE id = ?',
    [registrationId],
    (err, results) => {

      if (err) throw err;

      const registration = results[0];

      const pricing = {
        Fellow: 10000,
        Full: 7000,
        Associate: 5000,
        Student: 2000,
        Corporate: 15000
      };

      const amount = pricing[registration.category] || 5000;

      res.render('pages/agc-payment', {
        title: 'AGC Payment',
        category: registration.category,
        amount
      });
    }
  );
});


const pricing = {
  Fellow: 10000,
  Full: 7000,
  Associate: 5000,
  Student: 2000,
  Corporate: 15000
};


app.post('/agc/payment', async (req, res) => {

  const registrationId = req.session.registrationId;

  if (!registrationId) {
    return res.send('No registration found');
  }

  db.query(
    'SELECT * FROM registrations WHERE id = ?',
    [registrationId],
    async (err, results) => {

      if (err) {
        console.error(err);
        return res.send('Database error');
      }

      const registration = results[0];

      if (!registration) {
        return res.send('Registration not found');
      }

      // 🚫 OPTIONAL: block double payment (you can leave it commented if you want)
      /*
      if (registration.payment_status === 'paid') {
        req.flash('error_msg', 'You have already paid');
        return res.redirect('/agc');
      }
      */

      const pricing = {
        Fellow: 10000,
        Full: 7000,
        Associate: 5000,
        Student: 2000,
        Corporate: 15000
      };

      const category = registration.category;
      const amount = (pricing[category] || 5000) * 100;

      const email = req.session.agcEmail;

      if (!email) {
        return res.send('Email not found');
      }

      try {
        const response = await axios.post(
          'https://api.paystack.co/transaction/initialize',
          {
            email,
            amount,
            callback_url: 'http://localhost:3000/agc/verify'
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        res.redirect(response.data.data.authorization_url);

      } catch (error) {
        console.error(error.response?.data || error.message);
        res.send('Payment initialization failed');
      }

    }
  );
});

app.get('/agc/verify', async (req, res) => {
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

    if (response.data.data.status === 'success') {

  const registrationId = req.session.registrationId;

  db.query(
    'SELECT * FROM registrations WHERE id = ?',
    [registrationId],
    (err, results) => {

      if (err) throw err;

      const reg = results[0];

      db.query(
        'UPDATE registrations SET payment_status = "paid" WHERE id = ?',
        [registrationId],
        async (err) => {

          if (err) throw err;

          // 📧 SEND EMAIL
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: reg.email,
            subject: 'AGC Registration Confirmed',
            html: `
              <h2>Payment Successful 🎉</h2>
              <p>Dear ${reg.full_name},</p>
              <p>Your registration for the SESN Annual General Conference has been confirmed.</p>
              <p><strong>Category:</strong> ${reg.category}</p>
              <p><strong>Amount Paid:</strong> ₦5000</p>
              <br>
              <p>Thank you.</p>
            `
          };

          await transporter.sendMail(mailOptions);

          // CLEAR SESSION
          req.session.registrationId = null;
          req.session.agcEmail = null;

          res.redirect('/agc-success');
        }
      );
    }
  );
} else {
      res.send('Payment not successful');
    }

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send('Verification failed');
  }
});


app.get('/agc-success', (req, res) => {
  res.render('pages/agc-success', {
    title: 'Payment Successful'
  });
});

app.get('/past-presidents', (req, res) => {
  db.query('SELECT * FROM presidents ORDER BY tenure_start DESC', (err, results) => {
    if (err) throw err;

    res.render('pages/presidents', {
      title: 'Past Presidents',
      presidents: results
    });
  });
});

app.get('/admin/presidents', ensureAdmin, (req, res) => {
  res.render('admin/add-president');
});

app.post('/admin/presidents', ensureAdmin, upload.single('image'), (req, res) => {
  const { full_name, tenure_start, tenure_end } = req.body;

  const image = req.file
    ? '/uploads/' + req.file.filename
    : null;

  db.query(
    'INSERT INTO presidents (full_name, tenure_start, tenure_end, image) VALUES (?, ?, ?, ?)',
    [full_name, tenure_start, tenure_end, image],
    (err) => {
      if (err) throw err;

      req.flash('success_msg', 'President added');
      res.redirect('/past-presidents');
    }
  );
});

app.get('/admin/presidents/manage', ensureAdmin, (req, res) => {
  db.query('SELECT * FROM presidents ORDER BY tenure_start DESC', (err, results) => {
    if (err) throw err;

    res.render('admin/manage-presidents', {
      title: 'Manage Presidents',
      presidents: results
    });
  });
});

app.get('/admin/presidents/edit/:id', ensureAdmin, (req, res) => {

  db.query('SELECT * FROM presidents WHERE id = ?', [req.params.id], (err, results) => {
    if (err) throw err;

    res.render('admin/edit-president', {
      title: 'Edit President',
      president: results[0]
    });
  });
});
app.post('/admin/presidents/edit/:id', ensureAdmin, (req, res) => {

  const { full_name, tenure_start, tenure_end } = req.body;

  db.query(
    'UPDATE presidents SET full_name = ?, tenure_start = ?, tenure_end = ? WHERE id = ?',
    [full_name, tenure_start, tenure_end, req.params.id],
    (err) => {
      if (err) throw err;

      req.flash('success_msg', 'President updated');
      res.redirect('/admin/presidents/manage');
    }
  );
});

app.post('/admin/presidents/delete/:id', ensureAdmin, (req, res) => {

  db.query(
    'DELETE FROM presidents WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) throw err;

      req.flash('success_msg', 'President deleted');
      res.redirect('/admin/presidents/manage');
    }
  );
});

// =======================
// OTHER ROUTES
// =======================

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', journalRoutes);
app.use('/', paymentRoutes);


// =======================
// SERVER
// =======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});