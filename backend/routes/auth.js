const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

// Logout: clear the cookie
router.post('/logout', (req, res) => {
	res.clearCookie('token');
	res.json({ success: true });
});

module.exports = router;
