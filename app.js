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
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'views')));
// Routes
app.use('/users', userRoutes);
app.use('/', messageRoutes);

// Sync database and start server
//{ force: true }
sequelize
  .sync()
  .then(() => {
    console.log('Database synced');
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  })
  .catch((err) => console.error('Error syncing database:', err));
