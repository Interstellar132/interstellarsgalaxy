const { SlashCommandBuilder } = require('discord.js');
const Blacklist = require('../models/Blacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage blacklisted words')
    
    // Add a word
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a word to the blacklist')
        .addStringOption(option =>
          option.setName('word')
            .setDescription('The word to blacklist')
            .setRequired(true)
        )
    )
    // Remove a word
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a word from the blacklist')
        .addStringOption(option =>
          option.setName('word')
            .setDescription('The word to remove from the blacklist')
            .setRequired(true)
        )
    )
    // View all blacklisted words
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all blacklisted words for this server')
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'add') {
        const word = interaction.options.getString('word').toLowerCase();

        const existing = await Blacklist.findOne({ guildId, word });
        if (existing) {
          return interaction.reply({ content: `❌ "${word}" is already blacklisted.`, ephemeral: true });
        }

        const newEntry = new Blacklist({ guildId, word });
        await newEntry.save();
        return interaction.reply({ content: `✅ Blacklisted the word: "${word}"`, ephemeral: true });

      } else if (subcommand === 'remove') {
        const word = interaction.options.getString('word').toLowerCase();

        const deleted = await Blacklist.findOneAndDelete({ guildId, word });
        if (!deleted) {
          return interaction.reply({ content: `❌ "${word}" was not found in the blacklist.`, ephemeral: true });
        }

        return interaction.reply({ content: `✅ Removed "${word}" from the blacklist.`, ephemeral: true });

      } else if (subcommand === 'view') {
        const words = await Blacklist.find({ guildId }).sort({ word: 1 });
        if (!words.length) {
          return interaction.reply({ content: '⚠️ No blacklisted words for this server.', ephemeral: true });
        }

        const wordList = words.map(entry => entry.word).join(', ');
        return interaction.reply({ content: `🛑 Blacklisted words:\n${wordList}`, ephemeral: true });
      }

    } catch (err) {
      console.error('Blacklist command error:', err);
      return interaction.reply({ content: '⚠️ An error occurred while processing this command.', ephemeral: true });
    }
  }
};
