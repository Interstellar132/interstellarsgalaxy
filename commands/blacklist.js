const { SlashCommandBuilder } = require('discord.js');
const Blacklist = require('../models/Blacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage the word blacklist')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a word to the blacklist')
        .addStringOption(option => 
          option.setName('word')
                .setDescription('Word to blacklist')
                .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a word from the blacklist')
        .addStringOption(option => 
          option.setName('word')
                .setDescription('Word to remove from blacklist')
                .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all blacklisted words in this server')),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'add') {
        const word = interaction.options.getString('word').toLowerCase();

        const exists = await Blacklist.findOne({ guildId, word });
        if (exists)
          return interaction.reply({ content: `❌ "${word}" is already blacklisted.`, ephemeral: true });

        // Escape regex characters and add word boundaries
        const regexStr = `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;

        const newEntry = new Blacklist({
          guildId,
          word,
          addedBy: interaction.user.id,
          regex: regexStr
        });

        await newEntry.save();
        return interaction.reply({ content: `✅ Blacklisted the word: "${word}"`, ephemeral: true });
      }

      if (subcommand === 'remove') {
        const word = interaction.options.getString('word').toLowerCase();

        const deleted = await Blacklist.findOneAndDelete({ guildId, word });
        if (!deleted)
          return interaction.reply({ content: `❌ "${word}" was not found in the blacklist.`, ephemeral: true });

        return interaction.reply({ content: `✅ Removed "${word}" from the blacklist.`, ephemeral: true });
      }

      if (subcommand === 'view') {
        const words = await Blacklist.find({ guildId });
        if (!words.length)
          return interaction.reply({ content: `⚠️ No words are currently blacklisted.`, ephemeral: true });

        const list = words.map(entry => `• ${entry.word}`).join('\n');
        return interaction.reply({ content: `📜 Blacklisted words:\n${list}`, ephemeral: true });
      }

    } catch (err) {
      console.error('Blacklist command error:', err);
      return interaction.reply({ content: '❌ An error occurred while managing the blacklist.', ephemeral: true });
    }
  },
};
