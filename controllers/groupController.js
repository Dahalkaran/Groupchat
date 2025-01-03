const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const Message = require('../models/message');
const User = require('../models/user');
const { Op } = require('sequelize');

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
      createdBy: req.user.userId,
    });

    // Add the creator as an admin
    await GroupMember.create({
      userId: req.user.userId,
      groupId: group.id,
      isAdmin: true,
    });

    res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    const isMember = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId },
    });
    if (!isMember) return res.status(403).json({ message: 'Unauthorized access to group' });

    const members = await GroupMember.findAll({
      where: { groupId },
      include: {
        model: User,
        attributes: ['id', 'name', 'email'],
      },
      attributes: ['isAdmin'],
    });

    res.status(200).json({
      members: members.map((member) => ({
        id: member.User.id,
        name: member.User.name,
        email: member.User.email,
        isAdmin: member.isAdmin,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Invite user to group (Admin only)
exports.inviteToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if the user making the request is an admin
    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
    });

    if (!isAdmin) return res.status(403).json({ message: 'Only admins can invite users' });

    const existingMember = await GroupMember.findOne({ where: { groupId, userId } });
    if (existingMember) return res.status(400).json({ message: 'User is already a member of this group' });

    await GroupMember.create({ groupId, userId });
    res.status(201).json({ message: 'User added to group' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Make a user an admin in the group (Only admins can do this)
exports.makeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
    });
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can promote users' });

    const member = await GroupMember.findOne({ where: { groupId, userId } });
    if (!member) return res.status(404).json({ message: 'User is not a member of this group' });

    await member.update({ isAdmin: true });
    res.status(200).json({ message: 'User promoted to admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
    });
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can demote users' });

    const member = await GroupMember.findOne({ where: { groupId, userId } });
    if (!member || !member.isAdmin) {
      return res.status(404).json({ message: 'User is not an admin in this group' });
    }

    await member.update({ isAdmin: false });
    res.status(200).json({ message: 'Admin rights revoked' });
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

// Fetch members of a group with their roles
// Fetch members of a group with their roles
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if the user is part of the group
    const isMember = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId },
    });
    if (!isMember) return res.status(403).json({ message: 'Unauthorized access to group' });

    // Fetch members and their admin status
    const members = await GroupMember.findAll({
      where: { groupId },
      include: {
        model: User,
        attributes: ['id', 'name', 'email'], // Fetch user details
      },
      attributes: ['isAdmin'], // Include admin flag
    });

    // Respond with members and their roles
    res.status(200).json({
      members: members.map((member) => ({
        id: member.User.id,
        name: member.User.name,
        email: member.User.email,
        isAdmin: member.isAdmin,
      })),
    });
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
    //console.log("czxvxcvcxvcxvcxvcxv");
    const currentUserId = req.user.userId;
    //console.log(currentUserId);
    const users = await User.findAll({
      where: {
        id: {
          [Op.ne]: currentUserId, // Exclude the current user
        },
      },
      attributes: ['id', 'name', 'email'], // Return only necessary fields
    });
    //console.log(users);
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required' });

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { phone: { [Op.like]: `%${query}%` } },
        ],
      },
      attributes: ['id', 'name', 'email', 'phone'],
    });

    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeUserFromGroup = async (req, res) => {
  try {
   
    const { groupId, userId } = req.body;
     
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    //console.log(group);

    // Check if the requester is an admin of the group
    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
    });
    
    console.log(isAdmin);

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can remove users' });
    }
    // Check if the user to be removed is part of the group
    const userInGroup = await GroupMember.findOne({
      where: { groupId, userId },
    });

    if (!userInGroup) {
      return res.status(404).json({ message: 'User is not part of the group' });
    }

    // Remove the user from the group
    await GroupMember.destroy({ where: { groupId, userId } });

    res.status(200).json({ message: 'User removed from group successfully' });
  } catch (err) {
    console.error('Error in removing user from group:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};