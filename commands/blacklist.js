const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const blacklist = require('../utils/wordBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage blacklisted words')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a word to the blacklist')
        .addStringOption(opt =>
          opt
            .setName('word')
            .setDescription('Word to blacklist')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a word from the blacklist')
        .addStringOption(opt =>
          opt
            .setName('word')
            .setDescription('Word to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all blacklisted words')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const word = interaction.options.getString('word');

      const added = blacklist.add(word);
      if (!added) {
        return interaction.reply({
          content: `⚠️ **${word}** is already blacklisted.`,
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `✅ **${word}** has been added to the blacklist.`,
        ephemeral: true
      });
    }

    if (sub === 'remove') {
      const word = interaction.options.getString('word');

      const removed = blacklist.remove(word);
      if (!removed) {
        return interaction.reply({
          content: `⚠️ **${word}** is not in the blacklist.`,
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `🗑️ **${word}** has been removed from the blacklist.`,
        ephemeral: true
      });
    }

    if (sub === 'list') {
      const words = blacklist.list();

      if (!words.length) {
        return interaction.reply({
          content: '📭 No blacklisted words.',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `🚫 **Blacklisted Words:**\n${words.map(w => `• ${w}`).join('\n')}`,
        ephemeral: true
      });
    }
  }
};

