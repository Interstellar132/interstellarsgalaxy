const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const BACKUP_FILE = path.join(__dirname, '..', 'lockdown-backup.json');

function loadBackup() {
  if (!fs.existsSync(BACKUP_FILE)) return {};
  return JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
}

function saveBackup(data) {
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the server and restore permissions')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const executor = interaction.user;

    const backup = loadBackup();
    const guildBackup = backup[guild.id];

    if (!guildBackup) {
      return interaction.reply({
        content: '❌ Server is not in lockdown.',
        ephemeral: true
      });
    }

    for (const [channelId, overwrites] of Object.entries(guildBackup)) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.manageable) continue;

      try {
        // Clear current overwrites
        await channel.permissionOverwrites.set([]);

        // Restore saved overwrites
        for (const ow of overwrites) {
          await channel.permissionOverwrites.create(ow.id, {
            allow: BigInt(ow.allow),
            deny: BigInt(ow.deny),
            type: ow.type
          });
        }
      } catch (err) {
        console.error(`Unlock failed: ${channel?.name}`, err);
      }
    }

    delete backup[guild.id];
    saveBackup(backup);

    await interaction.reply(
      `🔓 **LOCKDOWN LIFTED**\nRestored by **${executor.tag}**`
    );
  }
};

