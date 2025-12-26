const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const backupFile = path.join(__dirname, '..', 'lockdown-backup.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Restore all channels to their state before lockdown'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'You need admin permissions to run this.', ephemeral: true });
    }

    if (!fs.existsSync(backupFile)) {
      return interaction.reply({ content: 'No backup found. Cannot unlock.', ephemeral: true });
    }

    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const channels = interaction.guild.channels.cache.filter(ch => ch.isTextBased());

    for (const ch of channels.values()) {
      const original = backup[ch.id];
      if (original === null) {
        // Remove any explicit SendMessages overwrite
        await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }).catch(() => {});
      } else if (original === true) {
        await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => {});
      } else if (original === false) {
        await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
      }
    }

    fs.unlinkSync(backupFile); // Delete backup after restoring
    await interaction.reply({ content: 'Server unlocked and original state restored.', ephemeral: true });
  }
};
