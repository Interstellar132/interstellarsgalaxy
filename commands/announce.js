const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to the announcement channel')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The announcement message')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const message = interaction.options.getString('message');

    const CHANNEL_ID = process.env.channelID;
    const OWNER_ID = process.env.OwnerID;

    const channel = interaction.guild.channels.cache.get(CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: 'Announcement channel not found.',
        ephemeral: true
      });
    }

    try {
      // Send the announcement
      await channel.send(message);

      // Confirm to the admin
      await interaction.reply({
        content: 'Announcement sent.',
        ephemeral: true
      });

      // Send DM to you (bot owner)
      const owner = await interaction.client.users.fetch(OWNER_ID);

      await owner.send({
        content:
`📢 **Announcement Used**
👤 User: ${interaction.user.tag} (${interaction.user.id})
🏠 Server: ${interaction.guild.name} (${interaction.guild.id})
📝 Message:
${message}`
      });

    } catch (error) {
      console.error(error);

      if (!interaction.replied) {
        await interaction.reply({
          content: 'Failed to send announcement.',
          ephemeral: true
        });
      }
    }
  },
};
