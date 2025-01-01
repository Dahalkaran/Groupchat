const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');
const groupController = require('../controllers/groupController'); // Import groupController
const path = require('path');

const router = express.Router();

// Route to serve the dashboard HTML
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// Route to fetch dashboard data (users and messages)
router.get('/dashboard/data', verifyToken, messageController.getDashboard);

// Route to send a new message
router.post('/send', verifyToken, messageController.sendMessage);

// Group chat routes

// Create a new group
router.post('/groups/create', verifyToken, groupController.createGroup);

// Invite a user to a group
router.post('/groups/invite', verifyToken, groupController.inviteToGroup);

// Get all groups for the logged-in user
router.get('/groups', verifyToken, groupController.getGroups);

// Fetch messages for a specific group
router.get('/groups/messages/:groupId', verifyToken, groupController.getGroupMessages);

// Send a message to a specific group
router.post('/groups/messages', verifyToken, groupController.sendGroupMessage);


router.get('/users',  groupController.getAllUsers);
module.exports = router;
