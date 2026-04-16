const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { ensureAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public journal routes
router.get('/journals', journalController.listAllJournals);
router.get('/journals/:id', journalController.showSingleJournal);

// Admin journal routes
router.get('/admin/journals', ensureAdmin, journalController.adminJournalList);
router.get('/admin/journals/new', ensureAdmin, journalController.showCreateJournalForm);
router.post('/admin/journals', ensureAdmin, upload.single('journal_file'), journalController.createJournal);

module.exports = router;