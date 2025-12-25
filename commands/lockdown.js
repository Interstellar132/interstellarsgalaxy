const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// In-memory store for original permissions
// Maps: guildId => { channelId => originalOverwrite }
const guildPermissionsBackup = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock all channels in the server (disable sending messages)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;

    // Store original permissions
    const backup = {};

    for (const [id, channel] of guild.channels.cache) {
      if (!channel.isTextBased()) continue;

      // Save current permission overwrite for @everyone
      const everyoneOverwrite = channel.permissionOverwrites.cache.get(guild.id);
      backup[id] = everyoneOverwrite ? everyoneOverwrite.allow.bitfield : null;

      try {
        await channel.permissionOverwrites.edit(guild.id, {
          SendMessages: false
        });
      } catch (err) {
        console.error(`Failed to lock channel ${channel.name}:`, err);
      }
    }

    guildPermissionsBackup.set(guild.id, backup);

    await interaction.reply('🔒 Server has been locked down. All text channels are now read-only.');
  },

  guildPermissionsBackup, // export for unlock command
};

