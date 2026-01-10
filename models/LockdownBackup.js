const mongoose = require('mongoose');

const lockdownBackupSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channels: {
    type: Map,
    of: Boolean, // true = could send, false = could not, null = not set
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LockdownBackup', lockdownBackupSchema);
