const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const Message = require('../models/message');
const User = require('../models/user');
const { Op } = require('sequelize');

// Create a new group
exports.createGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }

    const group = await Group.create({
      name,
      createdBy: req.user.userId,
    }, { transaction });

    // Add the creator as an admin
    await GroupMember.create({
      userId: req.user.userId,
      groupId: group.id,
      isAdmin: true,
    }, { transaction });

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
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
  const transaction = await sequelize.transaction();
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findByPk(groupId, { transaction });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if the user making the request is an admin
    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
      transaction,
    });

    if (!isAdmin) return res.status(403).json({ message: 'Only admins can invite users' });

    const existingMember = await GroupMember.findOne({ where: { groupId, userId }, transaction });
    if (existingMember) return res.status(400).json({ message: 'User is already a member of this group' });

    await GroupMember.create({ groupId, userId }, { transaction });

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({ message: 'User added to group' });
  } catch (err) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Make a user an admin in the group (Only admins can do this)
exports.makeAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { groupId, userId } = req.body;

    // Check if the user making the request is an admin
    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
      transaction,
    });
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can promote users' });

    // Find the member to be promoted
    const member = await GroupMember.findOne({ where: { groupId, userId }, transaction });
    if (!member) return res.status(404).json({ message: 'User is not a member of this group' });

    // Promote the user to admin
    await member.update({ isAdmin: true }, { transaction });

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ message: 'User promoted to admin' });
  } catch (err) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { groupId, userId } = req.body;

    // Check if the user making the request is an admin
    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
      transaction,
    });
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can demote users' });

    // Find the member to be demoted
    const member = await GroupMember.findOne({ where: { groupId, userId }, transaction });
    if (!member || !member.isAdmin) {
      return res.status(404).json({ message: 'User is not an admin in this group' });
    }

    // Demote the user from admin
    await member.update({ isAdmin: false }, { transaction });

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ message: 'Admin rights revoked' });
  } catch (err) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fetch groups for a user
exports.getGroups = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const groups = await Group.findAll({
      include: {
        model: GroupMember,
        where: { userId: req.user.userId },
        attributes: [],
        transaction, // Pass transaction here
      },
      transaction, // Pass transaction here
    });

    // Commit the transaction if everything goes smoothly
    await transaction.commit();
    
    res.status(200).json({ groups });
  } catch (err) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Fetch members of a group with their roles
// Fetch members of a group with their roles
exports.getGroupMembers = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { groupId } = req.params;

    // Check if the user is part of the group
    const isMember = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId },
      transaction, // Pass transaction here
    });
    if (!isMember) return res.status(403).json({ message: 'Unauthorized access to group' });

    // Fetch members and their admin status
    const members = await GroupMember.findAll({
      where: { groupId },
      include: {
        model: User,
        attributes: ['id', 'name', 'email'],
      },
      attributes: ['isAdmin'],
      transaction, // Pass transaction here
    });

    // Commit the transaction if everything goes smoothly
    await transaction.commit();

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
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Fetch messages for a group
exports.getGroupMessages = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { groupId } = req.params;

    // Check if the user is part of the group
    const isMember = await GroupMember.findOne({
      where: { userId: req.user.userId, groupId },
      transaction, // Pass transaction here
    });
    if (!isMember) return res.status(403).json({ message: 'Unauthorized access to group' });

    // Fetch messages for the group
    const messages = await Message.findAll({
      where: { groupId },
      include: {
        model: User,
        attributes: ['name'],
      },
      transaction, // Pass transaction here
    });

    // Commit the transaction if everything goes smoothly
    await transaction.commit();

    // Respond with the messages
    res.status(200).json({
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.User.name,
        message: msg.message,
      })),
    });
  } catch (err) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Send a message to a group
exports.sendGroupMessage = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { message, groupId } = req.body;
    const userId = req.user.userId;

    if (!message || !groupId) {
      return res.status(400).json({ message: 'Message and groupId are required' });
    }

    const isMember = await GroupMember.findOne({ where: { groupId, userId }, transaction });
    if (!isMember) return res.status(403).json({ message: 'Unauthorized access to group' });

    const newMessage = await Message.create({
      message,
      groupId,
      userId,
    }, { transaction });

    await transaction.commit();  // Commit the transaction

    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (err) {
    await transaction.rollback();  // Rollback the transaction on error
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Fetch all users
exports.getAllUsers = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const currentUserId = req.user.userId;
    const users = await User.findAll({
      where: {
        id: {
          [Op.ne]: currentUserId, // Exclude the current user
        },
      },
      attributes: ['id', 'name', 'email'],
      transaction, // Pass transaction here
    });

    await transaction.commit();  // Commit the transaction

    res.status(200).json({ users });
  } catch (err) {
    await transaction.rollback();  // Rollback the transaction on error
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.searchUsers = async (req, res) => {
  const transaction = await sequelize.transaction();
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
      transaction, // Pass transaction here
    });

    await transaction.commit();  // Commit the transaction

    res.status(200).json({ users });
  } catch (err) {
    await transaction.rollback();  // Rollback the transaction on error
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeUserFromGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findByPk(groupId, { transaction });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if the requester is an admin of the group
    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
      transaction, // Pass transaction here
    });

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can remove users' });
    }

    // Check if the user to be removed is part of the group
    const userInGroup = await GroupMember.findOne({
      where: { groupId, userId },
      transaction, // Pass transaction here
    });

    if (!userInGroup) {
      return res.status(404).json({ message: 'User is not part of the group' });
    }

    // Remove the user from the group
    await GroupMember.destroy({ where: { groupId, userId }, transaction });

    await transaction.commit();  // Commit the transaction

    res.status(200).json({ message: 'User removed from group successfully' });
  } catch (err) {
    await transaction.rollback();  // Rollback the transaction on error
    console.error('Error in removing user from group:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};