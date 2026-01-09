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
          opt.setName('word')
            .setDescription('The word to blacklist')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a word from the blacklist')
        .addStringOption(opt =>
          opt.setName('word')
            .setDescription('The word to remove')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all blacklisted words')
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    /* ===== ADD ===== */
    if (sub === 'add') {
      const word = interaction.options.getString('word').toLowerCase();

      if (await blacklist.exists(guildId, word)) {
        return interaction.reply({
          content: '❌ That word is already blacklisted.',
          ephemeral: true
        });
      }

      await blacklist.add(guildId, word);

      return interaction.reply({
        content: `✅ **${word}** has been added to the blacklist.`
      });
    }

    /* ===== REMOVE ===== */
    if (sub === 'remove') {
      const word = interaction.options.getString('word').toLowerCase();

      const removed = await blacklist.remove(guildId, word);
      if (!removed) {
        return interaction.reply({
          content: '❌ That word is not in the blacklist.',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `🗑️ **${word}** has been removed from the blacklist.`
      });
    }

    /* ===== LIST ===== */
    if (sub === 'list') {
      const words = await blacklist.list(guildId);

      if (!words.length) {
        return interaction.reply({
          content: '📭 No blacklisted words.',
          ephemeral: true
        });
      }

      return interaction.reply({
        content:
          `🚫 **Blacklisted Words:**\n` +
          words.map(w => `• ${w.word}`).join('\n')
      });
    }
  }
};
