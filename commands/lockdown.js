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
    .setName('lockdown')
    .setDescription('Lock the entire server (persistent)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const executor = interaction.user;

    const backup = loadBackup();

    if (backup[guild.id]) {
      return interaction.reply({
        content: 'Server is already in lockdown.',
        ephemeral: true
      });
    }

    backup[guild.id] = {};

    for (const [id, channel] of guild.channels.cache) {
      if (!channel.manageable) continue;

      backup[guild.id][id] = channel.permissionOverwrites.cache.map(ow => ({
        id: ow.id,
        type: ow.type,
        allow: ow.allow.bitfield.toString(),
        deny: ow.deny.bitfield.toString()
      }));

      try {
        await channel.permissionOverwrites.edit(guild.id, {
          SendMessages: false,
          Speak: false
        });
      } catch (err) {
        console.error(`Lock failed: ${channel.name}`, err);
      }
    }

    saveBackup(backup);

    await interaction.reply(
      `**SERVER LOCKED DOWN**\nTriggered by **${executor.tag}**`
    );
  }
};
