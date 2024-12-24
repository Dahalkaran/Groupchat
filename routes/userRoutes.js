const express = require('express');
const path = require('path');
const userController = require('../controllers/userController');
const router = express.Router();

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/signup.html')); // Use 'path' to resolve file paths
  });
router.post('/signup', userController.signup);

module.exports = router;
