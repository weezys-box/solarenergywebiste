const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

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