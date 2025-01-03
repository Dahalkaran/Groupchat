const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const Message = require('../models/message');
const User = require('../models/user');
const { sequelize } = require('../config/database'); // Assuming sequelize instance is exported here
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

    const group = await Group.create(
      { name, createdBy: req.user.userId },
      { transaction }
    );

    // Add the creator as an admin
    await GroupMember.create(
      { userId: req.user.userId, groupId: group.id, isAdmin: true },
      { transaction }
    );

    await transaction.commit();
    res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fetch group members
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

    const existingMember = await GroupMember.findOne({
      where: { groupId, userId },
      transaction,
    });
    if (existingMember) return res.status(400).json({ message: 'User is already a member of this group' });

    await GroupMember.create({ groupId, userId }, { transaction });
    await transaction.commit();
    res.status(201).json({ message: 'User added to group' });
  } catch (err) {
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

    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
      transaction,
    });
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can promote users' });

    const member = await GroupMember.findOne({
      where: { groupId, userId },
      transaction,
    });
    if (!member) return res.status(404).json({ message: 'User is not a member of this group' });

    await member.update({ isAdmin: true }, { transaction });
    await transaction.commit();
    res.status(200).json({ message: 'User promoted to admin' });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Revoke admin rights (with transactions)
exports.deleteAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { groupId, userId } = req.body;

    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
      transaction,
    });

    if (!isAdmin) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Only admins can demote users' });
    }

    const member = await GroupMember.findOne({
      where: { groupId, userId },
      transaction,
    });

    if (!member || !member.isAdmin) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User is not an admin in this group' });
    }

    await member.update({ isAdmin: false }, { transaction });
    await transaction.commit();

    res.status(200).json({ message: 'Admin rights revoked' });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Send a message to a group (with transactions)
exports.sendGroupMessage = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { message, groupId } = req.body;
    const userId = req.user.userId;

    if (!message || !groupId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Message and groupId are required' });
    }

    const isMember = await GroupMember.findOne({
      where: { groupId, userId },
      transaction,
    });

    if (!isMember) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Unauthorized access to group' });
    }

    const newMessage = await Message.create(
      { message, groupId, userId },
      { transaction }
    );

    await transaction.commit();
    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove a user from a group (with transactions)
exports.removeUserFromGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findByPk(groupId, { transaction });
    if (!group) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = await GroupMember.findOne({
      where: { groupId, userId: req.user.userId, isAdmin: true },
      transaction,
    });

    if (!isAdmin) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Only admins can remove users' });
    }

    const userInGroup = await GroupMember.findOne({
      where: { groupId, userId },
      transaction,
    });

    if (!userInGroup) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User is not part of the group' });
    }

    await GroupMember.destroy({ where: { groupId, userId }, transaction });
    await transaction.commit();

    res.status(200).json({ message: 'User removed from group successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Error in removing user from group:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
