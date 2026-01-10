const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const LockdownBackup = require('../models/LockdownBackup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock all text channels and save their original state'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'You need admin permissions to run this.', ephemeral: true });
    }

    const channels = interaction.guild.channels.cache.filter(ch => ch.isTextBased());
    const backup = {};

    for (const ch of channels.values()) {
      const everyonePerm = ch.permissionOverwrites.cache.get(
        interaction.guild.roles.everyone.id
      );

      let canSend = null;

      if (everyonePerm) {
        canSend = everyonePerm.allow.has(PermissionsBitField.Flags.SendMessages);
      }

      backup[ch.id] = canSend;

      await ch.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: false }
      ).catch(() => {});
    }

    // Save to MongoDB (upsert = replace if already exists)
    await LockdownBackup.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { channels: backup },
      { upsert: true, new: true }
    );

    await interaction.reply({ content: '🔒 Server locked down and state saved to database.', ephemeral: true });
  }
};
