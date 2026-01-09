const { Schema, model } = require('mongoose');

const blacklistSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  word: { type: String, required: true },
  regex: { type: String, required: true } // stored as string
});

blacklistSchema.index({ guildId: 1, word: 1 }, { unique: true });

module.exports = model('Blacklist', blacklistSchema);
