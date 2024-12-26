const Message = require('../models/message');
const User = require('../models/user');

// Fetch all messages and online users
exports.getDashboard = async (req, res) => {
  console.log('getDashboard endpoint hit');
  try {
    const users = await User.findAll({
      attributes: ['id', 'name'],
    });

    const messages = await Message.findAll({
      include: {
        model: User,
        attributes: ['name'],
      },
    });

    const formattedMessages = [];
    for (const msg of messages) {
      formattedMessages.push({
        id: msg.id,
        sender: msg.User.name,
        message: msg.message,
      });
    }

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
