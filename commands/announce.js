const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Make an announcement')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The announcement message')
        .setRequired(true)
    )
    // Only administrators can use this command
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const message = interaction.options.getString('message');

    // Replace this with your fixed announcement channel ID
    const channelId = process.env.channelID;
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({ content: 'Cannot find the announcement channel!', ephemeral: true });
    }

    try {
      await channel.send(message);
      await interaction.reply({ content: 'Announcement sent!', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Failed to send the announcement.', ephemeral: true });
    }
  },
};
