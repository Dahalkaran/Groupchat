// cronJobs/archiveMessages.js
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Message } = require('./models/message');
const ArchivedChat = require('./models/archivedChat');

// This cron job will run every night at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    // Find messages older than 1 day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    // Move messages older than 1 day to ArchivedChat table
    const oldMessages = await Message.findAll({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

    if (oldMessages.length > 0) {
      const archivedMessages = oldMessages.map(message => ({
        message: message.message,
        userId: message.userId,
        groupId: message.groupId,
        createdAt: message.createdAt,
      }));

      // Bulk insert old messages into the ArchivedChat table
      await ArchivedChat.bulkCreate(archivedMessages);

      // Delete old messages from the Message table
      await Message.destroy({
        where: {
          createdAt: {
            [Op.lt]: oneDayAgo,
          },
        },
      });

      console.log(`Archived and deleted ${oldMessages.length} messages.`);
    }
  } catch (error) {
    console.error('Error during message archiving:', error);
  }
});
