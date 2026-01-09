const Blacklist = require('../models/Blacklist');

function wordToRegex(word) {
  const map = {
    a: '[a4@]',
    e: '[e3]',
    i: '[i1!]',
    o: '[o0]',
    s: '[s5$]',
    t: '[t7]',
    l: '[l1|]',
    b: '[b8]',
    g: '[g9]',
    v: '[v]',
    r: '[r4]'
  };

  const pattern = word
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('');

  return `\\b${pattern}\\b`;
}

module.exports = {
  async add(guildId, word, userId) {
    const regex = wordToRegex(word);

    await Blacklist.create({
      guildId,
      word: word.toLowerCase(),
      regex,
      addedBy: userId
    });
  },

  async remove(guildId, word) {
    return Blacklist.findOneAndDelete({
      guildId,
      word: word.toLowerCase()
    });
  },

  async list(guildId) {
    return Blacklist.find({ guildId }).lean();
  },

  async matches(content, guildId) {
    const entries = await Blacklist.find({ guildId }).lean();
    const lower = content.toLowerCase();

    for (const entry of entries) {
      const regex = new RegExp(entry.regex, 'i');
      if (regex.test(lower)) {
        return entry.word;
      }
    }
    return null;
  }
};
