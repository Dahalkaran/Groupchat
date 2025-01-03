const { Op } = require('sequelize');
const Message = require('../models/message');
const User = require('../models/user');

// Fetch all messages and online users
exports.getDashboard = async (req, res) => {
  console.log('getDashboard endpoint hit');
  try {
    const lastMessageId = req.query.lastMessageId || 0; // Default to 0 if not provided

    // Fetch users
    const users = await User.findAll({
      attributes: ['id', 'name'],
    });

    // Fetch messages with an ID greater than lastMessageId
    const messages = await Message.findAll({
      where: {
        id: { [Op.gt]: lastMessageId }, // Sequelize's greater-than operator
      },
      include: {
        model: User,
        attributes: ['name','id'],
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sender: msg.User.id === req.user.userId ? 'you' : msg.User.name, // Show 'u' for logged-in user's messages
      message: msg.message,
    }));

    res.status(200).json({
      users,
      messages: formattedMessages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Send a message
exports.sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  try {
    const newMessage = await Message.create({
      message,
      userId: req.user.userId, // userId is available in req.user from verifyToken middleware
    });

    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
