const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/chatRoutes');
const path = require('path');

require('dotenv').config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000', // Allow requests from your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Include Authorization header
    credentials: true, // Allow cookies to be sent with requests
  })
);

app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});
// Sync database and start server
sequelize
  .sync()
  .then(() => {
    console.log('Database synced');
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  })
  .catch((err) => console.error('Error syncing database:', err));
