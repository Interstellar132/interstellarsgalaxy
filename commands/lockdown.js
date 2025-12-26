const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock all text channels'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'You need admin permissions to run this.', ephemeral: true });
    }

    const channels = interaction.guild.channels.cache.filter(ch => ch.isTextBased());
    for (const ch of channels.values()) {
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
    }

    await interaction.reply({ content: 'Server locked down.', ephemeral: true });
  }
};
