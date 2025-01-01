const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const Message = require('../models/message');
const User = require('../models/user');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }
    const group = await Group.create({
      name,
      createdBy: req.user.userId, // Use the authenticated user's ID
    });
    await GroupMember.create({
      userId: req.user.userId,
      groupId: group.id,
    });

    res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Invite user to group
exports.inviteToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const existingMember = await GroupMember.findOne({ where: { groupId, userId } });
    if (existingMember) return res.status(400).json({ message: 'User is already a member of this group' });

    await GroupMember.create({ groupId, userId });
    res.status(201).json({ message: 'User added to group' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fetch groups for a user
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: {
        model: GroupMember,
        where: { userId: req.user.userId },
        attributes: [],
      },
    });

    res.status(200).json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Fetch messages for a group
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const isMember = await GroupMember.findOne({
      where: { userId: req.user.userId, groupId },
    });
    if (!isMember) return res.status(403).json({ message: 'Unauthorized access to group' });

    const messages = await Message.findAll({
      where: { groupId },
      include: {
        model: User,
        attributes: ['name'],
      },
    });

    res.status(200).json({
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.User.name,
        message: msg.message,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Send a message to a group
exports.sendGroupMessage = async (req, res) => {
  try {
    const { message, groupId } = req.body;
    const userId = req.user.userId;

    if (!message || !groupId) {
      return res.status(400).json({ message: 'Message and groupId are required' });
    }

    const isMember = await GroupMember.findOne({ where: { groupId, userId } });
    if (!isMember) return res.status(403).json({ message: 'Unauthorized access to group' });

    const newMessage = await Message.create({
      message,
      groupId,
      userId,
    });

    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fetch all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email'], // Fetch only the needed attributes
    });

    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
