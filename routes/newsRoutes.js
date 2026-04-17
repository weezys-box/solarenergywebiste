const express = require('express');
const router = express.Router();
const news = require('../data/news');   // ✅ ADD THIS

router.get('/news-events', (req, res) => {
  res.render('pages/news-events', {
    title: 'News & Events',
    news: news   // ✅ ADD THIS
  });
});

module.exports = router;