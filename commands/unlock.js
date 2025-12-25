const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { guildPermissionsBackup } = require('./lockdown');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Restore all channels to previous permissions')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const executor = interaction.user;

    const backup = guildPermissionsBackup.get(guild.id);
    if (!backup) {
      return interaction.reply('No backup found. Server may not have been locked.');
    }

    for (const [channelId, overwrites] of Object.entries(backup)) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.manageable) continue;

      // Restore all overwrites
      try {
        for (const [id, ow] of Object.entries(overwrites)) {
          await channel.permissionOverwrites.edit(id, {
            allow: BigInt(ow.allow),
            deny: BigInt(ow.deny),
            type: ow.type
          });
        }
      } catch (err) {
        console.error(`Failed to unlock channel ${channel.name}:`, err);
      }
    }

    guildPermissionsBackup.delete(guild.id);

    await interaction.reply(`🔓 Server unlocked by ${executor.tag}. All channel permissions restored.`);
  },
};

