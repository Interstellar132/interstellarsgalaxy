const { Schema, model } = require('mongoose');

const warningSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  count: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

warningSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model('Warning', warningSchema);
