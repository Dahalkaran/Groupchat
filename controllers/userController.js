const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, GroupMember } = require('../models');  // Add other models if needed
const { Op } = require('sequelize');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  const { name, email, phone, password } = req.body;

  const t = await sequelize.transaction(); // Start a transaction

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) {
      await t.rollback(); // Rollback transaction if user already exists
      return res.status(400).json({ message: 'User already exists' });
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user within the transaction
    const newUser = await User.create(
      { name, email, phone, password: hashedPassword },
      { transaction: t }
    );

    // Commit the transaction if everything is successful
    await t.commit();

    res.status(201).json({ message: 'Signup successful!' });
  } catch (err) {
    console.error(err);
    await t.rollback(); // Rollback transaction on error
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const t = await sequelize.transaction(); // Start a transaction

  try {
    // Step 1: Find the user by email within the transaction
    const user = await User.findOne({ where: { email }, transaction: t });
    if (!user) {
      await t.rollback(); // Rollback if user is not found
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await t.rollback(); // Rollback if password is incorrect
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Step 3: Create JWT token with expiration (1 hour)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expiry time set to 1 hour
    );

    // Commit the transaction if everything is successful
    await t.commit();

    // Step 4: Send the token to the frontend
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    await t.rollback(); // Rollback transaction on error
    res.status(500).json({ message: 'Internal server error' });
  }
};
