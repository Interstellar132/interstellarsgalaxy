const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Blacklist = require('../models/Blacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Prohibited terms management')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Adds a prohibited term')
        .addStringOption(option => 
          option.setName('word')
                .setDescription('Word to add')
                .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Removes a prohibited term')
        .addStringOption(option => 
          option.setName('word')
                .setDescription('Word to remove')
                .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all prohibited terms in this server')),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'add') {
        const word = interaction.options.getString('word').toLowerCase();

        const exists = await Blacklist.findOne({ guildId, word });
        if (exists)
          return interaction.reply({ content: `"${word}" is already prohibited.`, ephemeral: true });

        
        const regexStr = `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;

        const newEntry = new Blacklist({
          guildId,
          word,
          addedBy: interaction.user.id,
          regex: regexStr
        });

        await newEntry.save();
        return interaction.reply({ content: `"${word}" as been added to prohibited terms.`, ephemeral: true });
      }

      if (subcommand === 'remove') {
        const word = interaction.options.getString('word').toLowerCase();

        const deleted = await Blacklist.findOneAndDelete({ guildId, word });
        if (!deleted)
          return interaction.reply({ content: `"${word}" is currently not prohibited.`, ephemeral: true });

        return interaction.reply({ content: `"${word}" Has been removed from prohibited terms.`, ephemeral: true });
      }

      if (subcommand === 'view') {
        const words = await Blacklist.find({ guildId });
        if (!words.length)
          return interaction.reply({ content: `You don't have any prohibited terms. Do /blacklist add {word}.`, ephemeral: true });

        const list = words.map(entry => `• ${entry.word}`).join('\n');
        return interaction.reply({ content: `# __Prohibited Terms__ \n${list}`, ephemeral: true });
      }

    } catch (err) {
      console.error('Blacklist command error:', err);
      return interaction.reply({ content: 'An error occurred while managing prohibited terms.', ephemeral: true });
    }
  },
};
