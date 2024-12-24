const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    await User.create({ name, email, phone, password: hashedPassword });

    res.status(201).json({ message: 'Signup successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Step 1: Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });  // User not found
    }

    // Step 2: Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'User not authorized' });  // Incorrect password
    }

    // Step 3: Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
            JWT_SECRET,                                                // Token expiry time (1 hour)
    );

    // Step 4: Send the token to the frontend
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};