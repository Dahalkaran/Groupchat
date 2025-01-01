const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Group = require('./group');
const User = require('./user');

const GroupMember = sequelize.define('GroupMember', {
  groupId: {
    type: DataTypes.INTEGER,
    references: {
      model: Group,
      key: 'id',
    },
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
    allowNull: false,
  },
});

Group.hasMany(GroupMember, { foreignKey: 'groupId' });
User.hasMany(GroupMember, { foreignKey: 'userId' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });
GroupMember.belongsTo(User, { foreignKey: 'userId' });

module.exports = GroupMember;
