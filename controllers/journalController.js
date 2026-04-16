const Journal = require('../models/Journal');
const Category = require('../models/Category');
const db = require('../config/db');

exports.showCreateJournalForm = (req, res) => {
  Category.getAll((err, categories) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Could not load categories');
      return res.redirect('/admin/dashboard');
    }

    res.render('admin/create-journal', {
      title: 'Upload Journal',
      categories
    });
  });
};

exports.createJournal = (req, res) => {
  try {
    const { title, abstract, author, category_id, year, keywords, access_type } = req.body;

    if (!req.file) {
      req.flash('error_msg', 'Please upload a PDF file');
      return res.redirect('/admin/journals/new');
    }

    const newJournal = {
      title,
      abstract,
      author,
      category_id,
      year,
      keywords,
      file_path: `/uploads/journals/${req.file.filename}`,
      access_type,
      uploaded_by: req.session.user.id
    };

    Journal.create(newJournal, (err, result) => {
      if (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to upload journal');
        return res.redirect('/admin/journals/new');
      }

      req.flash('success_msg', 'Journal uploaded successfully');
      res.redirect('/admin/journals');
    });

  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Server error');
    res.redirect('/admin/journals/new');
  }
};

exports.listAllJournals = (req, res) => {
  const { search, category } = req.query;

  let sql = `
    SELECT journals.*, categories.name AS category_name
    FROM journals
    LEFT JOIN categories ON journals.category_id = categories.id
    WHERE 1
  `;

  const params = [];

  // Search by title or author
  if (search) {
    sql += ` AND (journals.title LIKE ? OR journals.author LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Filter by category
  if (category) {
    sql += ` AND journals.category_id = ?`;
    params.push(category);
  }

  sql += ` ORDER BY journals.created_at DESC`;

  const Category = require('../models/Category');

  db.query(sql, params, (err, journals) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Could not fetch journals');
      return res.redirect('/');
    }

    Category.getAll((err, categories) => {
      if (err) categories = [];

      res.render('journals/index', {
        title: 'All Journals',
        journals,
        categories,
        search,
        category
      });
    });
  });
};

exports.showSingleJournal = (req, res) => {
  const journalId = req.params.id;

  Journal.getById(journalId, (err, results) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Could not fetch journal');
      return res.redirect('/journals');
    }

    if (results.length === 0) {
      req.flash('error_msg', 'Journal not found');
      return res.redirect('/journals');
    }

    const journal = results[0];

    // Restrict premium journals
    if (journal.access_type === 'premium') {
      if (!req.session.user || req.session.user.membership_type !== 'premium') {
        req.flash('error_msg', 'You need a premium membership to access this journal');
        return res.redirect('/journals');
      }
    }

    res.render('journals/single', {
      title: journal.title,
      journal
    });
  });
};

exports.adminJournalList = (req, res) => {
  Journal.getAll((err, journals) => {
    if (err) {
      console.error(err);
      req.flash('error_msg', 'Could not fetch journals');
      return res.redirect('/admin/dashboard');
    }

    res.render('admin/journals', {
      title: 'Manage Journals',
      journals
    });
  });
};