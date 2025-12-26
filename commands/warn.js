module.exports = {
  data: {
    name: 'warn',
    description: 'Warn a member'
  },
  async execute(interaction) { // <-- async here
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    // DM the user
    await user.send(`You were warned for: ${reason}`).catch(() => null);

    // Log the warning
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
