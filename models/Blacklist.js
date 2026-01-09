const mongoose = require('mongoose');

const BlacklistSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  word: { type: String, required: true },
  regex: { type: String, required: true },
  addedBy: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Blacklist', BlacklistSchema);

