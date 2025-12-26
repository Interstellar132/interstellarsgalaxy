const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const backupFile = path.join(__dirname, '..', 'lockdown-backup.json');

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
      // Save current SendMessages permission for @everyone
      const everyonePerm = ch.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);
      backup[ch.id] = everyonePerm ? everyonePerm.allow.has(0x00000800) : null; // SEND_MESSAGES bit

      // Lock channel
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
    }

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    await interaction.reply({ content: 'Server locked down and state saved.', ephemeral: true });
  }
};
