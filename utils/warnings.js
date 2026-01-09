const Warning = require('../models/Warning');

module.exports = {
  async get(guildId, userId) {
    const doc = await Warning.findOne({ guildId, userId });
    return doc ? doc.count : 0;
  },

  async increment(guildId, userId) {
    const doc = await Warning.findOneAndUpdate(
      { guildId, userId },
      {
        $inc: { count: 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    return doc.count;
  },

  async reset(guildId, userId) {
    await Warning.findOneAndUpdate(
      { guildId, userId },
      { count: 0 }
    );
  },

  async clearGuild(guildId) {
    await Warning.deleteMany({ guildId });
  }
};
