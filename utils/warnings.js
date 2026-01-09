const Warning = require('../models/Warning');

const DAY = 24 * 60 * 60 * 1000;

function applyDecay(doc) {
  if (!doc) return 0;

  const daysPassed = Math.floor(
    (Date.now() - doc.lastUpdated.getTime()) / DAY
  );

  if (daysPassed > 0) {
    doc.count = Math.max(0, doc.count - daysPassed);
    doc.lastUpdated = new Date();
  }

  return doc.count;
}

module.exports = {
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

    applyDecay(doc);
    doc.count += 1;
    doc.lastUpdated = new Date();
    await doc.save();

    return doc.count;
  },

  async get(guildId, userId) {
    const doc = await Warning.findOne({ guildId, userId });
    if (!doc) return 0;

    applyDecay(doc);
    await doc.save();
    return doc.count;
  },

  async reset(guildId, userId) {
    await Warning.deleteOne({ guildId, userId });
  }
};
