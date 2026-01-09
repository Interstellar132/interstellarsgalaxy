const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const warningStore = require('../utils/warnings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings-reset')
    .setDescription('Reset warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to reset')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');

    await warningStore.reset(
      interaction.guild.id,
      user.id
    );

    await interaction.reply({
      content: `✅ Warnings reset for **${user.tag}**`,
      ephemeral: true
    });
  }
};
