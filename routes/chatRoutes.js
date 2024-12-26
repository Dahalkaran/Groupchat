const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');
const path = require('path');

const router = express.Router();
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
  });
// Route to fetch dashboard data (users and messages)
router.get('/dashboard/data', verifyToken, messageController.getDashboard);

// Route to send a new message
router.post('/send', verifyToken, messageController.sendMessage);

module.exports = router;
