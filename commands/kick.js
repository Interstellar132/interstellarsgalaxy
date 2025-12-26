const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { sendLog } = require('../utils/logger.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for kick')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({ content: 'You do not have permission to kick members.', ephemeral: true });
    }

    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!member) return interaction.reply({ content: 'Member not found', ephemeral: true });

    await member.kick(reason).catch(err => console.error(err));

    await sendLog(interaction.client, {
      title: '👢 Member Kicked',
      color: 0xED4245,
      fields: [
        { name: 'User', value: member.user.tag },
        { name: 'Reason', value: reason },
        { name: 'Moderator', value: interaction.user.tag }
      ],
      timestamp: new Date()
    });

    await interaction.reply({ content: `Kicked ${member.user.tag}`, ephemeral: true });
  }
};
