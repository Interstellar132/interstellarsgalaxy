const { SlashCommandBuilder, PermissionsBitField  } = require('discord.js');
const blacklist = require('../utils/wordBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    .setName('blacklist')
    .setDescription('Manage blocked words')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a word to the blacklist')
        .addStringOption(opt =>
          opt.setName('word')
            .setDescription('Word to block')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a word from the blacklist')
        .addStringOption(opt =>
          opt.setName('word')
            .setDescription('Word to unblock')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all blacklisted words')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const word = interaction.options.getString('word')?.toLowerCase();

    if (sub === 'add') {
      const result = blacklist.add(word);

      return interaction.reply({
        content: result.added
          ? `🚫 **${word}** has been blacklisted (variants included).`
          : `⚠️ **${word}** is already blacklisted.`,
        ephemeral: true
      });
    }

    if (sub === 'remove') {
      blacklist.remove(word);
      return interaction.reply({
        content: `🗑️ **${word}** removed from the blacklist.`,
        ephemeral: true
      });
    }

    if (sub === 'list') {
      const words = blacklist.load();
      return interaction.reply({
        content: words.length
          ? `🚫 Blacklisted words:\n\`${words.join('`, `')}\``
          : '✅ No blacklisted words set.',
        ephemeral: true
      });
    }
  }
};
