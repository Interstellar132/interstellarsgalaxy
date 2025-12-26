const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { wordBlacklist } = require('../utils/automod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blockword')
    .setDescription('Add or remove a word from the automod blacklist')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('Word to block/unblock')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Add or remove the word')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' }
        )),
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const word = interaction.options.getString('word').toLowerCase();
    const action = interaction.options.getString('action');
    const guildId = interaction.guild.id;

    if (!wordBlacklist.has(guildId)) wordBlacklist.set(guildId, new Set());
    const set = wordBlacklist.get(guildId);

    if (action === 'add') {
      set.add(word);
      await interaction.reply({ content: `✅ Word **${word}** added to blacklist.`, ephemeral: true });
    } else if (action === 'remove') {
      set.delete(word);
      await interaction.reply({ content: `✅ Word **${word}** removed from blacklist.`, ephemeral: true });
    }
  }
};
