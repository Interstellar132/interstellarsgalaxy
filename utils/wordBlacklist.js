const Blacklist = require('../models/Blacklist');
const { wordToRegex } = require('./wordVariants');

module.exports = {
  async add(guildId, word) {
    const regex = wordToRegex(word);

    return Blacklist.create({
      guildId,
      word: word.toLowerCase(),
      regex
    });
  },

  async exists(guildId, word) {
    return Blacklist.exists({ guildId, word: word.toLowerCase() });
  },

  async list(guildId) {
    return Blacklist.find({ guildId });
  },

  async match(guildId, content) {
    const entries = await Blacklist.find({ guildId });

    for (const entry of entries) {
      const re = new RegExp(entry.regex, 'i');
      if (re.test(content)) {
        return entry.word;
      }
    }
    return null;
  }
};
