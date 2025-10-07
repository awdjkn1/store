const express = require('express');
const { authMiddleware, adminMiddleware } = require('../../middlewares/authMiddleware');

const router = express.Router();

router.get('/test', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Admin access granted', user: req.user });
});

module.exports = router;
