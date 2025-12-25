const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// In-memory backup: guildId => { channelId => originalOverwrites }
const guildPermissionsBackup = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock all channels for everyone')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const executor = interaction.user;

    const backup = {};

    for (const [id, channel] of guild.channels.cache) {
      // Only channels the bot can manage
      if (!channel.manageable) continue;

      // Save ALL current permission overwrites
      const overwrites = {};
      channel.permissionOverwrites.cache.forEach(ow => {
        overwrites[ow.id] = {
          allow: ow.allow.bitfield,
          deny: ow.deny.bitfield,
          type: ow.type
        };
      });
      backup[id] = overwrites;

      // Lock @everyone
      try {
        await channel.permissionOverwrites.edit(guild.id, { SendMessages: false, Speak: false });
      } catch (err) {
        console.error(`Failed to lock channel ${channel.name}:`, err);
      }
    }

    guildPermissionsBackup.set(guild.id, backup);

    await interaction.reply(`🔒 Server locked down by ${executor.tag}. All channels are read-only.`);
  },

  guildPermissionsBackup
};
