const Warning = require('../models/Warning');

module.exports = {
  // Increment a user's warnings
  async increment(guildId, userId, username) {
    const doc = await Warning.findOneAndUpdate(
      { guildId, userId },
      { $inc: { count: 1 }, username, lastUpdated: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return doc.count;
  },

  // Get a user's warning count
  async get(guildId, userId) {
    const doc = await Warning.findOne({ guildId, userId });
    return doc?.count || 0;
  },

  // Reset a user's warnings
  async reset(guildId, userId) {
    await Warning.deleteOne({ guildId, userId });
  },

  // Get all warnings in a guild, sorted by count descending
  async getAll(guildId) {
    return Warning.find({ guildId }).sort({ count: -1 });
  }
};
