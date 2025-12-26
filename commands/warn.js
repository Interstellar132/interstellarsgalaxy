const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue warning')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(false)
    )
    // Admin-only
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason =
      interaction.options.getString('reason') || 'No reason provided';

    // Make sure the user is still in the guild
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: 'I cannot find this user.',
        ephemeral: true
      });
    }

    // DM the warned user
    let dmSuccess = true;
    try {
      await target.send(
        `You have been warned for ${reason}. Please refer to the rules channel of the server.`
      );
    } catch (err) {
      dmSuccess = false;
    }

    // Confirm to moderator
    await interaction.reply({
      content:
        `**${target.tag}** has been warned.` +
        (dmSuccess ? '' : '\n Could not DM the user.'),
      ephemeral: false
    });
  }
};

const { sendLog } = require('../utils/logger');

await sendLog(interaction.client, {
  title: '⚠️ Member Warned',
  color: 0xFEE75C,
  fields: [
    { name: 'User', value: target.tag },
    { name: 'Moderator', value: interaction.user.tag },
    { name: 'Reason', value: reason }
  ]
});
