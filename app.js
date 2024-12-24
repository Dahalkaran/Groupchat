const express = require('express');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/users', userRoutes);

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
