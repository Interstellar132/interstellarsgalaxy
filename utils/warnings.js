const Warning = require('../models/Warning');

module.exports = {
  // Increment a user's warning count
  async increment(guildId, userId) {
    let doc = await Warning.findOne({ guildId, userId });

    if (!doc) {
      doc = await Warning.create({
        guildId,
        userId,
        count: 1
      });
      return 1;
    }

    doc.count += 1;
    doc.lastUpdated = new Date();
    await doc.save();

    return doc.count;
  },

  // Get a user's warning count
  async get(guildId, userId) {
    const doc = await Warning.findOne({ guildId, userId });
    if (!doc) return 0;
    return doc.count;
  },

  // Reset a user's warnings
  async reset(guildId, userId) {
    await Warning.deleteOne({ guildId, userId });
  }
};
