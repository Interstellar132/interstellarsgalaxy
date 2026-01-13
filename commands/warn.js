const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { sendLog } = require('../utils/logger.js');
const Warning = require('../models/Warning');

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
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: 'You do not have permission to warn members.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    // Upsert + increment warning count
    const warningDoc = await Warning.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: user.id },
      {
        $inc: { count: 1 },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    // DM the user
    await user.send(
      `⚠️ You have been warned for: ${reason}\n`
    ).catch(() => null);

    // Log warning
    await sendLog(interaction.client, {
      title: '⚠️ Member Warned',
      color: 0xED4245,
      fields: [
        { name: 'User', value: user.tag },
        { name: 'Total Warnings', value: String(warningDoc.count), inline: true },
        { name: 'Reason', value: reason },
        { name: 'Moderator', value: interaction.user.tag }
      ],
      timestamp: new Date()
    });

    await interaction.reply({
      content: `✅ Warned ${user.tag} (Total warnings: ${warningDoc.count})`,
      ephemeral: true
    });
  }
};

