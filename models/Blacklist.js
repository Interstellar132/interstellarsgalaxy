const { Schema, model } = require('mongoose');

const blacklistSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    index: true
  },
  word: {
    type: String,
    required: true
  },
  regex: {
    type: String,
    required: true
  },
  addedBy: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

blacklistSchema.index({ guildId: 1, word: 1 }, { unique: true });

module.exports = model('Blacklist', blacklistSchema);
