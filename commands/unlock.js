const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const LockdownBackup = require('../models/LockdownBackup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Restore all channels to their state before lockdown'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'You need admin permissions to run this.', ephemeral: true });
    }

    const backup = await LockdownBackup.findOne({ guildId: interaction.guild.id });

    if (!backup) {
      return interaction.reply({ content: 'No backup found. Cannot unlock. (uh oh!)', ephemeral: true });
    }

    const channels = interaction.guild.channels.cache.filter(ch => ch.isTextBased());

    for (const ch of channels.values()) {
      const original = backup.channels.get(ch.id);

      if (original === undefined || original === null) {
        // Remove overwrite
        await ch.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { SendMessages: null }
        ).catch(() => {});
      } 
      else if (original === true) {
        await ch.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { SendMessages: true }
        ).catch(() => {});
      } 
      else if (original === false) {
        await ch.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { SendMessages: false }
        ).catch(() => {});
      }
    }

    // Delete backup after restoring
    await LockdownBackup.deleteOne({ guildId: interaction.guild.id });

    await interaction.reply({ content: '🔓 Server unlocked.', ephemeral: true });
  }
};
