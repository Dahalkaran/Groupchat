const express = require('express');
const path = require('path');
const userController = require('../controllers/userController');
const router = express.Router();

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/signup.html')); 
  });
router.post('/signup', userController.signup);

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html')); 
  });
router.post('/login', userController.login);

module.exports = router;
