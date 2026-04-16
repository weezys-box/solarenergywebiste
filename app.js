const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const journalRoutes = require('./routes/journalRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Database connection
require('./config/db');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user || null;
  next();
});

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');

// Routes
app.get('/', (req, res) => {
  res.render('pages/home', { title: 'Home' });
});

app.get('/about', (req, res) => {
  res.render('pages/about', { title: 'About' });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', { title: 'Contact' });
});

app.get('/membership', (req, res) => {
  res.render('pages/membership', { title: 'Membership' });
});

// app.get('/login', (req, res) => {
//   res.render('auth/login', { title: 'Login' });
// });

// app.get('/register', (req, res) => {
//   res.render('auth/register', { title: 'Register' });
// });

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', journalRoutes);
app.use('/', paymentRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});