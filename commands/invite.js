const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('The bot will send you an invite to the server.'),

  async execute(interaction) {
    const user = interaction.user;

    try {
      await user.send('Here\'s the server invite: https://discord.gg/ry6zwuQe8z');
      await interaction.reply({ content: 'I have DM\'d you an invite to the server.', ephemeral: true });
    } catch (err) {
      // User likely has DMs off
      await interaction.reply({ content: 'I couldn\'t send you an invite likely due to your dms being off. Please enable dms and retry the command.', ephemeral: true });
    }
  }
};
