const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock all text channels'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'You need admin permissions to run this.', ephemeral: true });
    }

    const channels = interaction.guild.channels.cache.filter(ch => ch.isTextBased());
    for (const ch of channels.values()) {
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }).catch(() => {});
    }

    await interaction.reply({ content: 'Server unlocked.', ephemeral: true });
  }
};
