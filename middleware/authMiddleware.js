const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) => {
 // console.log(req.headers.authorization);
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
exports.socketAuth = (socket, next) => {
  const token = socket.handshake.auth?.token;
 // console.log('Socket Auth Token:', token); // Debugging token reception
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded Token:', decoded); // Debugging token decoding
    socket.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err); // Debugging errors
    next(new Error('Authentication error: Invalid token'));
  }
};
