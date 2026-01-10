const mongoose = require('mongoose');

const YouTubeStateSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  lastVideoId: { type: String }
});

module.exports = mongoose.model('YouTubeState', YouTubeStateSchema);
