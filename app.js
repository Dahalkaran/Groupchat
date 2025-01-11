const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/chatRoutes');
const path = require('path');
const http = require('http');
require('dotenv').config();
const { socketAuth } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO and make it globally available
const { Server } = require('socket.io');
global.io = new Server(server, {
  cors: {
    origin:'*',// ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

io.use(socketAuth);

// Socket.IO connection event
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.user?.name || 'Unknown'}`);
  console.log('New client connected:', socket.id);
  //console.log("HJjghcfhcfcgf gf f   gc g    gh v   g g g hj   km,m  m km ,m ,m km l ,m ,m ,m m, km,    m m m m n n n bnb bv bv bv v v")
  // Handle group message sending
  socket.on('sendMessage', (data) => {
    io.to(data.groupId).emit('newMessage', {
      message: data.message,
      groupId: data.groupId,
      sender: socket.user ? socket.user.name : 'Unknown',
    });
  });

  // Join a group room
  socket.on('joinGroup', (groupId) => {
    console.log(`User joined group: ${groupId}`);
    socket.join(groupId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
//console.log("HJjghcfhcfcgf gf f   gc g    gh v   g g g hj   km,m  m km ,m ,m km l ,m ,m ,m m, km,    m m m m n n n bnb bv bv bv v v")
// Middleware setup
app.use(
  cors({
    origin: ['http://13.238.50.191:3000', 'http://13.238.50.191:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'views')));

// Routes
app.use('/users', userRoutes);
app.use('/', messageRoutes);
app.use((req, res) => {
  res.sendFile('login.html', { root: './views' });
});
//console.log(io);

// Sync database and start server
const PORT = process.env.PORT || 3000;
sequelize.sync()
.then((  ) => {
  console.log('Database synced');
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
