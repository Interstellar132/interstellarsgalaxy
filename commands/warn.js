const { SlashCommandBuilder } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for warning')
        .setRequired(false)),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    // DM the user
    await user.send(`You were warned for: ${reason}`).catch(() => null);

    // Log warning
    await sendLog(interaction.client, {
      title: '⚠️ Member Warned',
      color: 0xED4245,
      fields: [
        { name: 'User', value: user.tag },
        { name: 'Reason', value: reason },
        { name: 'Moderator', value: interaction.user.tag }
      ],
      timestamp: new Date()
    });

    await interaction.reply({ content: `Warned ${user.tag}`, ephemeral: true });
  }
};
